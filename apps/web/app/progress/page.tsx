/**
 * @module apps/web/app/progress/page
 *
 * Route entry point for /progress.
 * Responsibilities: session check + auth redirect only.
 * All data fetching is delegated to ProgressContainer.
 */

import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/auth";
import ProgressContainer    from "@/containers/ProgressContainer";

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";

  return <ProgressContainer userId={userId} />;
}
