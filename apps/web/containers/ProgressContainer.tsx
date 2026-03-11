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

  const viewData = mapProgressViewData(progress, curriculum as unknown[]);

  return <ProgressView data={viewData} />;
}
