import { describe, expect, test } from 'bun:test';

import {
  applyRawReading,
  beginSession,
  emptyTally,
  localDateKey,
  parseStoredTally,
  stepsForDate,
} from '@/lib/stepTally';

const DAY = '2026-11-21';
const NEXT_DAY = '2026-11-22';

describe('localDateKey', () => {
  test('format AAAA-MM-JJ avec zéros de tête', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('cumul par abonnement', () => {
  test('une session simple additionne les lectures brutes', () => {
    let tally = beginSession(emptyTally(DAY), DAY, null);
    tally = applyRawReading(tally, 40, DAY);
    tally = applyRawReading(tally, 130, DAY);
    expect(tally.steps).toBe(130);
  });

  test('deux sessions le même jour ne se remplacent pas', () => {
    let tally = beginSession(emptyTally(DAY), DAY, null);
    tally = applyRawReading(tally, 500, DAY);
    tally = beginSession(tally, DAY, null);
    tally = applyRawReading(tally, 200, DAY);
    expect(tally.steps).toBe(700);
  });

  test('remise à zéro du compteur système : la lecture entière est ajoutée', () => {
    let tally = beginSession(emptyTally(DAY), DAY, null);
    tally = applyRawReading(tally, 300, DAY);
    tally = applyRawReading(tally, 25, DAY);
    expect(tally.steps).toBe(325);
  });
});

describe('référence de départ (iOS, depuis minuit)', () => {
  test('la référence est retenue si elle est plus grande que le cumul', () => {
    const tally = beginSession(emptyTally(DAY), DAY, 4200);
    expect(tally.steps).toBe(4200);
  });

  test('pas de double comptage : la référence ne baisse jamais le cumul', () => {
    let tally = beginSession(emptyTally(DAY), DAY, 1000);
    tally = applyRawReading(tally, 50, DAY);
    tally = beginSession(tally, DAY, 900);
    expect(tally.steps).toBe(1050);
  });

  test('une référence invalide est ignorée', () => {
    expect(beginSession(emptyTally(DAY), DAY, -5).steps).toBe(0);
    expect(beginSession(emptyTally(DAY), DAY, Number.NaN).steps).toBe(0);
  });
});

describe('changement de jour', () => {
  test('le cumul repart de zéro au nouveau jour', () => {
    let tally = beginSession(emptyTally(DAY), DAY, null);
    tally = applyRawReading(tally, 9000, DAY);
    tally = applyRawReading(tally, 120, NEXT_DAY);
    expect(tally.date).toBe(NEXT_DAY);
    expect(tally.steps).toBe(120);
  });

  test('stepsForDate renvoie zéro pour un cumul d’un autre jour', () => {
    const tally = { date: DAY, steps: 7000, lastRaw: 0 };
    expect(stepsForDate(tally, DAY)).toBe(7000);
    expect(stepsForDate(tally, NEXT_DAY)).toBe(0);
  });
});

describe('lectures invalides', () => {
  test('une lecture négative ou non finie est ignorée', () => {
    const tally = beginSession(emptyTally(DAY), DAY, null);
    expect(applyRawReading(tally, -1, DAY)).toBe(tally);
    expect(applyRawReading(tally, Number.POSITIVE_INFINITY, DAY)).toBe(tally);
  });
});

describe('parseStoredTally', () => {
  test('accepte une valeur bien formée', () => {
    expect(parseStoredTally({ date: DAY, steps: 12.7, lastRaw: 3 })).toEqual({
      date: DAY,
      steps: 12,
      lastRaw: 3,
    });
  });

  test('rejette une valeur corrompue ou d’un format inattendu', () => {
    expect(parseStoredTally(null)).toBeNull();
    expect(parseStoredTally('abc')).toBeNull();
    expect(parseStoredTally({ date: '21/11/2026', steps: 1, lastRaw: 0 })).toBeNull();
    expect(parseStoredTally({ date: DAY, steps: -1, lastRaw: 0 })).toBeNull();
    expect(parseStoredTally({ date: DAY, steps: 1 })).toBeNull();
  });
});
