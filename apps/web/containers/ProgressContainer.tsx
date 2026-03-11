/**
 * @module apps/web/containers/ProgressContainer
 *
 * Server component. Owns all data-fetching and mapping for the progress screen.
 *
 * Fetches GET /api/progress/:userId and GET /api/curriculum in parallel,
 * maps via lib/mappers/progress, then renders ProgressView.
 */

import { apiFetch }          from "@/lib/api";
import { mapProgressViewData } from "@/lib/mappers/progress";
import ProgressView          from "@/components/mathai/progress/ProgressView";

interface Props {
  userId: string;
}

export default async function ProgressContainer({ userId }: Props) {
  const [progress, curriculum] = await Promise.all([
    apiFetch(`/progress/${userId}`),
    apiFetch<unknown[]>("/curriculum").then((d) => d ?? []),
  ]);

  // If the API is down, progress will be null. Surface an error rather than
  // rendering a zeroed-out progress screen indistinguishable from a new account.
  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-md border border-red-100">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-black text-gray-800 mb-2">Could not load your progress</h2>
          <p className="text-gray-500 text-sm mb-6">
            The server is taking too long to respond. Please check your connection or try again in a moment.
          </p>
          <a
            href="/progress"
            className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  const viewData = mapProgressViewData(progress, curriculum as unknown[]);

  return <ProgressView data={viewData} />;
}
