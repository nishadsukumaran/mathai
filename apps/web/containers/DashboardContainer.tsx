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

  // If the API is down, dashboard will be null. Surface an error rather than
  // rendering a zeroed-out dashboard that looks like an empty new account.
  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-md border border-red-100">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-black text-gray-800 mb-2">Could not load your dashboard</h2>
          <p className="text-gray-500 text-sm mb-6">
            The server is taking too long to respond. Please check your connection or try again in a moment.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  const viewData = mapDashboardViewData(dashboard, curriculum as unknown[]);

  return <DashboardView data={viewData} />;
}
