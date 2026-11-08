import { describe, expect, test } from 'bun:test';

import { DICTS, LANGUAGES } from './i18n';

type Dictionary = Record<string, string>;

const en = DICTS.en as Dictionary;
const KEYS = Object.keys(en);

const SAME_AS_ENGLISH_ALLOWED = new Set([
  'Facebook',
  'kcal',
  '× 1000 m',
  'Timer',
  'Coach',
  'Bronze',
  'Gold',
  'Name',
  'Workouts',
  'Pause',
  'Calories',
  'Minutes',
  'Distance',
  'Expert',
  'Endurance',
  'Notifications',
  'Error',
  'Variable',
  'Version {version}',
  'made by mikaté production.',
  'Photo',
]);

const dictFor = (code: string): Dictionary => (DICTS as Record<string, Dictionary | undefined>)[code] ?? {};

describe('i18n coverage', () => {
  test('chaque langue déclarée possède un dictionnaire', () => {
    for (const language of LANGUAGES) {
      expect(DICTS[language.code]).toBeDefined();
    }
  });

  test('chaque langue contient toutes les clés de la langue source', () => {
    for (const language of LANGUAGES) {
      const dict = dictFor(language.code);
      const missing = KEYS.filter((key) => dict[key] === undefined);
      expect(missing).toEqual([]);
    }
  });

  test('aucune valeur vide', () => {
    for (const language of LANGUAGES) {
      const dict = dictFor(language.code);
      const empty = KEYS.filter((key) => typeof dict[key] !== 'string' || dict[key].trim() === '');
      expect(empty).toEqual([]);
    }
  });

  test('les placeholders {variable} sont conservés dans chaque traduction', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).slice().sort();
    for (const language of LANGUAGES) {
      const dict = dictFor(language.code);
      for (const key of KEYS) {
        expect({ key, placeholders: placeholders(dict[key]) }).toEqual({
          key,
          placeholders: placeholders(en[key]),
        });
      }
    }
  });
});

describe('régression : texte resté en anglais', () => {
  test('aucune traduction non anglaise identique à l\'anglais, hors exceptions', () => {
    for (const language of LANGUAGES) {
      if (language.code === 'en') continue;
      const dict = dictFor(language.code);
      const leaks = KEYS.filter(
        (key) =>
          dict[key] === en[key] &&
          !key.startsWith('coach.system.') &&
          !SAME_AS_ENGLISH_ALLOWED.has(en[key])
      );
      expect({ language: language.code, leaks }).toEqual({ language: language.code, leaks: [] });
    }
  });
});
