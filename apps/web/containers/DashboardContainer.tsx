/**
 * @module apps/web/containers/DashboardContainer
 *
 * Server component. Owns all data-fetching and mapping for the dashboard screen.
 *
 * Responsibilities:
 *  - Fetch GET /api/dashboard/:userId and GET /api/curriculum in parallel
 *  - Map raw API JSON → DashboardViewData using lib/mappers/dashboard
 *  - Render DashboardView with the mapped props
 *
 * Does NOT:
 *  - Handle auth (page.tsx does that)
 *  - Know about React state or events
 *  - Import any UI components directly
 *
 * Client-side data (profile, practice menu) is fetched inside DashboardView
 * via useProfile() and usePracticeMenu() hooks — kept client-side because
 * they are personalised and must stay fresh without full page reloads.
 */

import { apiFetch }            from "@/lib/api";
import { mapDashboardViewData } from "@/lib/mappers/dashboard";
import DashboardView           from "@/components/mathai/dashboard/DashboardView";

interface Props {
  userId: string;
}

export default async function DashboardContainer({ userId }: Props) {
  const [dashboard, curriculum] = await Promise.all([
    apiFetch(`/dashboard/${userId}`),
    apiFetch<unknown[]>("/curriculum").then((d) => d ?? []),
  ]);

  const viewData = mapDashboardViewData(dashboard, curriculum as unknown[]);

  return <DashboardView data={viewData} />;
}
