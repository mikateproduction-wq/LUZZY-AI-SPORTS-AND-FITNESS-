/**
 * Cumul quotidien des pas, sans dépendance native (testable).
 *
 * Le capteur ne donne pas le total du jour : `watchStepCount` renvoie le nombre de pas
 * depuis le début de l'abonnement, et repart à zéro à chaque abonnement. Ce module
 * transforme ces lectures brutes en total fiable pour la journée, en tenant compte :
 *   - des abonnements successifs (ouverture et fermeture de l'écran ou de l'app) ;
 *   - d'une référence de départ fournie par le système (iOS : pas depuis minuit) ;
 *   - du changement de jour ;
 *   - d'une lecture invalide ou d'un compteur remis à zéro par le système.
 */

export const DAILY_STEP_GOAL = 10000;

export interface StepTally {
  /** Date locale du cumul, au format AAAA-MM-JJ. */
  date: string;
  /** Total de pas comptés pour `date`. */
  steps: number;
  /** Dernière lecture brute reçue pendant l'abonnement courant. */
  lastRaw: number;
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyTally(date: string): StepTally {
  return { date, steps: 0, lastRaw: 0 };
}

/**
 * Démarre un abonnement. Le compteur brut repart de zéro.
 * `baseline` est le total connu depuis minuit (iOS). On garde le plus grand des deux,
 * pour ne jamais perdre de pas déjà comptés ni compter deux fois.
 */
export function beginSession(tally: StepTally, date: string, baseline: number | null): StepTally {
  const sameDay = tally.date === date;
  const previous = sameDay ? tally.steps : 0;
  const steps = baseline !== null && Number.isFinite(baseline) && baseline >= 0
    ? Math.max(previous, Math.floor(baseline))
    : previous;
  return { date, steps, lastRaw: 0 };
}

/**
 * Intègre une lecture brute `raw` (pas depuis le début de l'abonnement).
 * Une lecture plus petite que la précédente signifie que le compteur a été remis à zéro :
 * on ajoute alors la lecture entière.
 */
export function applyRawReading(tally: StepTally, raw: number, date: string): StepTally {
  if (!Number.isFinite(raw) || raw < 0) {
    return tally;
  }
  const base: StepTally = tally.date === date ? tally : emptyTally(date);
  const delta = raw >= base.lastRaw ? raw - base.lastRaw : raw;
  return { date, steps: base.steps + delta, lastRaw: raw };
}

/** Total affiché pour la date donnée : zéro si le cumul concerne un autre jour. */
export function stepsForDate(tally: StepTally, date: string): number {
  return tally.date === date ? tally.steps : 0;
}

/** Vérifie qu'une valeur lue dans le stockage a la forme attendue. */
export function parseStoredTally(value: unknown): StepTally | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) ||
    typeof candidate.steps !== 'number' ||
    !Number.isFinite(candidate.steps) ||
    candidate.steps < 0 ||
    typeof candidate.lastRaw !== 'number' ||
    !Number.isFinite(candidate.lastRaw) ||
    candidate.lastRaw < 0
  ) {
    return null;
  }
  return { date: candidate.date, steps: Math.floor(candidate.steps), lastRaw: candidate.lastRaw };
}
