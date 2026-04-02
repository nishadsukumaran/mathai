/**
 * @module api/lib/dateUtils
 *
 * Shared date utility functions used across services.
 */

/** Days since a given date. Returns 9999 for null (meaning "never"). */
export function daysSince(date: Date | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}
