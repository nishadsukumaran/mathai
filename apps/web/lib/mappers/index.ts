/**
 * @module apps/web/lib/mappers
 *
 * Barrel export for all data mappers.
 * Mappers are the explicit boundary between raw API JSON and typed view contracts.
 *
 * Rule: only containers import from here. Views never call mappers directly.
 */

export * from "./dashboard";
export * from "./progress";
