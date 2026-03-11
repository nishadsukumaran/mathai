/**
 * @module app/admin/users/[id]/page
 *
 * Admin user detail — server component.
 * Fetches user data, renders AdminUserDetailView (client for actions).
 */

import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { apiFetch }          from "@/lib/api";
import AdminUserDetailView   from "@/components/admin/AdminUserDetailView";

export const metadata = { title: "User Detail — MathAI Admin" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin?callbackUrl=/admin/users");
  }

  const user = await apiFetch<Record<string, unknown>>(`/admin/users/${params.id}`);
  if (!user) notFound();

  return <AdminUserDetailView user={user as never} />;
}
