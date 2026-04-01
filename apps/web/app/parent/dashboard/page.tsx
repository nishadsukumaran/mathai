/**
 * @module app/parent/dashboard/page
 *
 * Server component — fetches parent dashboard data for a child
 * and renders the ParentDashboardView.
 */

import { redirect }         from "next/navigation";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { apiFetch }          from "@/lib/api";
import ParentDashboardView   from "@/components/parent/ParentDashboardView";

interface Props {
  searchParams: Promise<{ childId?: string }>;
}

export default async function ParentDashboardPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/parent");

  const params  = await searchParams;
  const childId = params.childId ?? (session.user as { id?: string }).id ?? "";

  if (!childId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-md">
          <p className="text-4xl mb-4">👨‍👩‍👧</p>
          <h2 className="text-xl font-black text-gray-800 mb-2">No child linked</h2>
          <p className="text-gray-500 text-sm">Please contact support to link your child&apos;s account.</p>
        </div>
      </div>
    );
  }

  const data = await apiFetch<unknown>(`/parent/dashboard/${childId}`);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-md border border-red-100">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-black text-gray-800 mb-2">Could not load dashboard</h2>
          <p className="text-gray-500 text-sm mb-6">Please try again in a moment.</p>
          <a href="/parent" className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition">
            Retry
          </a>
        </div>
      </div>
    );
  }

  return <ParentDashboardView data={data as any} />;
}
