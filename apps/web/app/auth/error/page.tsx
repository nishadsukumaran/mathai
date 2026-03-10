/**
 * @module apps/web/app/auth/error
 *
 * Auth error page — shown when NextAuth encounters a sign-in error.
 *
 * The page itself is a static server component. The client-side URL-param
 * reading is isolated in <AuthErrorContent> and wrapped in <Suspense> so that
 * Next.js can pre-render a static shell without needing to execute
 * useSearchParams() at build time.
 */

import { Suspense } from "react";
import AuthErrorContent from "./AuthErrorContent";

function LoadingShell() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-800">Loading…</h1>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <AuthErrorContent />
    </Suspense>
  );
}
