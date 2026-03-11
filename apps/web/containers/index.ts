/**
 * @module apps/web/containers
 *
 * Barrel export for all screen containers.
 *
 * Containers are the data layer between route pages and view components.
 * They own: API fetching, mapping, auth-gated data, session state.
 *
 * Rules:
 *  - Server containers: use apiFetch (server-side auth cookie)
 *  - Client containers: use clientApi helpers or hooks (Bearer token)
 *  - No JSX UI logic — delegate rendering entirely to view components
 *  - Never import from components/ui directly
 */

// Server containers (async, no "use client")
export { default as DashboardContainer } from "./DashboardContainer";
export { default as ProgressContainer  } from "./ProgressContainer";

// Client containers ("use client", manage state)
export { default as PracticeContainer  } from "./PracticeContainer";
