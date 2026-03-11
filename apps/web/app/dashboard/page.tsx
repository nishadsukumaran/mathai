/**
 * @module apps/web/app/dashboard/page
 *
 * Route entry point for /dashboard.
 * Responsibilities: session check + auth redirect only.
 * All data fetching is delegated to DashboardContainer.
 */

import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/auth";
import DashboardContainer   from "@/containers/DashboardContainer";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/auth/signin");

  return <DashboardContainer userId={userId!} />;
}
