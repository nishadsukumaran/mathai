/**
 * @module apps/web/lib/mock-data
 *
 * Central export for all frontend mock data.
 *
 * HOW TO USE:
 *   Development (NEXT_PUBLIC_USE_MOCK_DATA=true):
 *     API hooks automatically return mock data — no backend needed.
 *
 *   Production:
 *     Hooks call the real API. Mock data is unused.
 *
 * TOGGLING:
 *   Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local to enable mock mode.
 *   This is the default until backend auth is wired.
 */

export * from "./dashboard.mock";
export * from "./curriculum.mock";
export * from "./progress.mock";
export * from "./practice.mock";

// ─── Mock router ──────────────────────────────────────────────────────────────
// Simulates network delay in development to catch loading state issues.

export const MOCK_DELAY_MS = 600;

export function withMockDelay<T>(data: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(data), MOCK_DELAY_MS)
  );
}
