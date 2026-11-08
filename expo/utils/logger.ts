/**
 * Development-only logger with automatic redaction of sensitive fields.
 *
 * - Production builds: every level is a no-op (MASWE-0005 — no data reaches
 *   production consoles, crash reporters or remote debuggers).
 * - Development builds: arguments containing keys like token / password /
 *   secret / verifier / authorization have those values redacted before
 *   printing, so tokens never leak even during debugging (CWE-532).
 */

const SENSITIVE_KEY_PATTERN =
  /(token|password|passwd|secret|verifier|authorization|api[_-]?key|private[_-]?key|cookie|session|credential|refresh)/i;

const REDACTED = '[REDACTED]';

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[…]';

  if (typeof value === 'string') {
    // Heuristic: bare JWTs passed as strings are redacted too.
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value) ? REDACTED : value;
  }

  if (value == null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (value instanceof Error) {
    return { name: value.name, message: redactValue(value.message, depth + 1) };
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY_PATTERN.test(k) ? REDACTED : redactValue(v, depth + 1);
  }
  return out;
}

export const logger = {
  log: (...args: unknown[]) => {
    if (__DEV__) console.log(...args.map((a) => redactValue(a)));
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(...args.map((a) => redactValue(a)));
  },
  error: (...args: unknown[]) => {
    if (__DEV__) console.error(...args.map((a) => redactValue(a)));
  },
};
