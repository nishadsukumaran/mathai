/**
 * @module app/403/page
 *
 * Access denied page — shown when a non-admin tries to access /admin/*.
 */

import Link from "next/link";

export const metadata = { title: "Access Denied — MathAI" };

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
        <p className="text-5xl mb-4">🚫</p>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-6">
          You don&apos;t have permission to view this page.
          Admin access is required.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition text-sm"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
