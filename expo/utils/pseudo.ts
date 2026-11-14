/**
 * Règles du pseudo public : 3 à 20 caractères, lettres latines et chiffres,
 * séparateurs « . », « _ » ou « - » autorisés une seule fois entre deux caractères,
 * sans séparateur en début ou en fin. L'unicité se fait sur la forme en minuscules.
 */

export const PSEUDO_MIN = 3;
export const PSEUDO_MAX = 20;

const PSEUDO_PATTERN = /^[a-z0-9](?:[._-]?[a-z0-9])*$/;

export type PseudoError = 'too_short' | 'too_long' | 'invalid_chars' | 'invalid_format';

export function normalizePseudo(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Retourne null si le pseudo est valide, sinon le motif de rejet. */
export function validatePseudo(raw: string): PseudoError | null {
  const value = normalizePseudo(raw);
  if (value.length < PSEUDO_MIN) return 'too_short';
  if (value.length > PSEUDO_MAX) return 'too_long';
  if (!/^[a-z0-9._-]+$/.test(value)) return 'invalid_chars';
  if (!PSEUDO_PATTERN.test(value)) return 'invalid_format';
  return null;
}

export function isValidPseudo(raw: string): boolean {
  return validatePseudo(raw) === null;
}
