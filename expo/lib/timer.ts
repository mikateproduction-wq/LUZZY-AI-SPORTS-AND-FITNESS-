export const MINUTE_MS = 60_000;

export function remainingMs(durationMs: number, elapsedMs: number): number {
  return Math.max(0, durationMs - elapsedMs);
}

export function minutesToFlush(
  loggedMs: number,
  elapsedMs: number
): { minutes: number; nextLoggedMs: number } {
  const delta = Math.max(0, elapsedMs - loggedMs);
  const minutes = Math.floor(delta / MINUTE_MS);
  return { minutes, nextLoggedMs: loggedMs + minutes * MINUTE_MS };
}

export function formatClock(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((milliseconds % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}
