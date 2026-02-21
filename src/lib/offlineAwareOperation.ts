/**
 * @deprecated — Use src/lib/offlineOutbox.ts instead.
 * This file is kept empty to avoid breaking any stale imports.
 */

export function isOfflineError(): boolean {
  return !navigator.onLine;
}
