import { describe, expect, test } from 'bun:test';
import { UN_COUNTRIES, CONTINENTS, getCountry, continentOf } from '@/data/countries';
import { isValidPseudo, validatePseudo } from '@/utils/pseudo';

describe('pays de l\'ONU', () => {
  test('193 États membres, codes uniques', () => {
    expect(UN_COUNTRIES.length).toBe(193);
    expect(new Set(UN_COUNTRIES.map((c) => c.code)).size).toBe(193);
  });

  test('chaque continent est représenté', () => {
    for (const continent of CONTINENTS) {
      expect(UN_COUNTRIES.some((c) => c.continent === continent)).toBe(true);
    }
  });

  test('cas limites du découpage M49', () => {
    expect(continentOf('RU')).toBe('europe');
    expect(continentOf('TR')).toBe('asia');
    expect(continentOf('EG')).toBe('africa');
    expect(continentOf('AU')).toBe('oceania');
    expect(getCountry('fr')?.name).toBe('France');
    expect(getCountry('XX')).toBeNull();
  });
});

describe('pseudo', () => {
  test('acceptés', () => {
    expect(isValidPseudo('abc')).toBe(true);
    expect(isValidPseudo('Mika.te_2026')).toBe(true);
    expect(isValidPseudo('a'.repeat(20))).toBe(true);
  });

  test('rejetés', () => {
    expect(validatePseudo('ab')).toBe('too_short');
    expect(validatePseudo('a'.repeat(21))).toBe('too_long');
    expect(validatePseudo('nom espace')).toBe('invalid_chars');
    expect(validatePseudo('éléphant')).toBe('invalid_chars');
    expect(validatePseudo('_abc')).toBe('invalid_format');
    expect(validatePseudo('ab..c')).toBe('invalid_format');
    expect(validatePseudo('abc-')).toBe('invalid_format');
  });
});
