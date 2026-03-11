/**
 * @module app/admin/dashboard/page
 *
 * Admin dashboard — platform-wide stats.
 * Server component: fetches stats from the Express API, renders immediately.
 * Middleware already verified the user is an admin before we reach here.
 */

import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { redirect }          from "next/navigation";
import AdminDashboardView    from "@/components/admin/AdminDashboardView";
import { apiFetch }          from "@/lib/api";

export const metadata = { title: "Dashboard — MathAI Admin" };

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  // Belt-and-suspenders guard (middleware already checks this)
  // @ts-ignore — extended session type
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin?callbackUrl=/admin/dashboard");
  }

  const stats = await apiFetch("/admin/dashboard");

  return <AdminDashboardView stats={stats} />;
}
