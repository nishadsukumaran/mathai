/**
 * @module app/admin/users/page
 *
 * Admin user management list — server component.
 * Reads search/filter params from the URL, fetches paginated user list from API.
 */

import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { redirect }          from "next/navigation";
import { apiFetch }          from "@/lib/api";
import AdminUsersView        from "@/components/admin/AdminUsersView";

export const metadata = { title: "Users — MathAI Admin" };

interface SearchParams {
  search?:   string;
  role?:     string;
  isActive?: string;
  page?:     string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "admin") {
    redirect("/auth/signin?callbackUrl=/admin/users");
  }

  const page     = parseInt(resolvedParams.page ?? "1", 10) || 1;
  const search   = resolvedParams.search   ?? "";
  const role     = resolvedParams.role     ?? "";
  const isActive = resolvedParams.isActive ?? "";

  const qs = new URLSearchParams();
  qs.set("page",  String(page));
  qs.set("limit", "20");
  if (search)   qs.set("search",   search);
  if (role)     qs.set("role",     role);
  if (isActive) qs.set("isActive", isActive);

  const result = await apiFetch<{ items: unknown[]; total: number; page: number; limit: number; totalPages: number }>(
    `/admin/users?${qs.toString()}`
  );

  return (
    <AdminUsersView
      users={(result?.items ?? []) as never}
      total={result?.total ?? 0}
      currentPage={page}
      totalPages={result?.totalPages ?? 1}
      filters={{ search, role, isActive }}
    />
  );
}
