/**
 * Input validation & sanitisation helpers (server-side mirror of UI limits).
 *
 * Every value that leaves the app (Supabase REST, OAuth endpoints) or is
 * persisted locally passes through these guards so that oversized,
 * control-character-laden or wrongly-typed payloads never reach the wire
 * (CWE-20, CWE-117, OWASP MASVS-INPUT).
 */

/** Strip control chars / zero-width chars and collapse whitespace. */
function stripUnsafe(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Human name: trimmed, printable, length-capped. */
export function sanitizeName(input: string, maxLength = 60): string {
  if (typeof input !== 'string') return '';
  const cleaned = stripUnsafe(input).trim();
  return cleaned.slice(0, maxLength);
}

/** Free-form text (notes, medical restrictions): capped and printable. */
export function sanitizeText(input: string, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  const cleaned = stripUnsafe(input).trim();
  return cleaned.slice(0, maxLength);
}

/** City name: letters, spaces, hyphens, apostrophes and accents only. */
export function sanitizeCity(input: string, maxLength = 80): string {
  if (typeof input !== 'string') return '';
  const cleaned = stripUnsafe(input).trim().slice(0, maxLength);
  return cleaned.replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '');
}

/** Integer clamped to an inclusive range; NaN-safe. */
export function clampInt(value: unknown, min: number, max: number, fallback = min): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

/** URL that MUST be https and short enough to be sane. */
export function isSecureUrl(value: unknown, maxLength = 2048): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * OAuth authorization code shape: opaque, URL-safe charset, sane length.
 * Rejects codes containing URLs, whitespace or control characters.
 */
export function isValidAuthCode(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 512 &&
    /^[A-Za-z0-9._~-]+$/.test(value)
  );
}

/** Accept only well-formed 3-part JWT strings (shape check, not signature). */
export function isJwtShape(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 8192 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value)
  );
}
