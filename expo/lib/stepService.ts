import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  applyRawReading,
  beginSession,
  emptyTally,
  localDateKey,
  parseStoredTally,
  stepsForDate,
  type StepTally,
} from '@/lib/stepTally';
import { logger } from '@/utils/logger';

/**
 * Service unique du podomètre. Un seul abonnement au capteur est actif,
 * quel que soit le nombre d'écrans qui affichent les pas (accueil, activité).
 * Le total du jour est persisté, pour survivre au redémarrage de l'app.
 */

const STORAGE_KEY = '@luzzy/steps_today';
const PERSIST_THROTTLE_MS = 5000;

export type StepsStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'denied';

export interface StepsSnapshot {
  status: StepsStatus;
  tally: StepTally;
}

type Listener = () => void;
type Subscription = { remove: () => void };

const listeners = new Set<Listener>();
let snapshot: StepsSnapshot = {
  status: 'idle',
  tally: emptyTally(localDateKey(new Date())),
};
let retainCount = 0;
let subscription: Subscription | null = null;
let startToken = 0;
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPersist = false;

function publish(next: Partial<StepsSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function todayKey(): string {
  return localDateKey(new Date());
}

async function writeTally(tally: StepTally): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tally));
  } catch (error) {
    logger.warn('[Steps] persist failed', error);
  }
}

function flushPersist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (pendingPersist) {
    pendingPersist = false;
    void writeTally(snapshot.tally);
  }
}

/** Écriture limitée : au plus une fois toutes les PERSIST_THROTTLE_MS pendant la marche. */
function schedulePersist(): void {
  pendingPersist = true;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flushPersist();
  }, PERSIST_THROTTLE_MS);
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseStoredTally(JSON.parse(raw)) : null;
    if (parsed && parsed.date === todayKey()) {
      publish({ tally: { ...parsed, lastRaw: 0 } });
    }
  } catch (error) {
    logger.warn('[Steps] hydrate failed', error);
  }
}

async function readMidnightBaseline(): Promise<number | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    const { Pedometer } = await import('expo-sensors');
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date());
    return result ? result.steps : null;
  } catch (error) {
    logger.warn('[Steps] midnight baseline unavailable', error);
    return null;
  }
}

async function start(): Promise<void> {
  const token = ++startToken;

  if (Platform.OS === 'web') {
    publish({ status: 'unavailable' });
    return;
  }

  publish({ status: 'loading' });
  await hydrate();

  try {
    const { Pedometer } = await import('expo-sensors');
    const available = await Pedometer.isAvailableAsync();
    if (token !== startToken) return;
    if (!available) {
      publish({ status: 'unavailable' });
      return;
    }

    const permission = await Pedometer.requestPermissionsAsync();
    if (token !== startToken) return;
    if (!permission.granted) {
      publish({ status: 'denied' });
      return;
    }

    const baseline = await readMidnightBaseline();
    if (token !== startToken) return;

    const today = todayKey();
    publish({ tally: beginSession(snapshot.tally, today, baseline) });
    schedulePersist();

    subscription = Pedometer.watchStepCount((result) => {
      const date = todayKey();
      publish({ tally: applyRawReading(snapshot.tally, result.steps, date) });
      schedulePersist();
    });

    publish({ status: 'ready' });
    logger.log('[Steps] Live subscription started');
  } catch (error) {
    logger.warn('[Steps] start failed', error);
    if (token === startToken) {
      publish({ status: 'unavailable' });
    }
  }
}

function stop(): void {
  startToken++;
  if (subscription) {
    subscription.remove();
    subscription = null;
    logger.log('[Steps] Subscription removed');
  }
  flushPersist();
}

/** Un écran qui affiche les pas s'abonne. Le capteur démarre au premier abonné. */
export function retainSteps(): void {
  retainCount++;
  if (retainCount === 1) {
    void start();
  }
}

/** Un écran se désabonne. Le capteur s'arrête quand plus aucun écran ne l'utilise. */
export function releaseSteps(): void {
  retainCount = Math.max(0, retainCount - 1);
  if (retainCount === 0) {
    stop();
  }
}

export function subscribeSteps(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStepsSnapshot(): StepsSnapshot {
  return snapshot;
}

/** Total du jour en cours, zéro si le cumul concerne un autre jour. */
export function getTodaySteps(current: StepsSnapshot): number {
  return stepsForDate(current.tally, todayKey());
}
