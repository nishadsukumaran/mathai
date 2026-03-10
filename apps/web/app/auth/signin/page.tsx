/**
 * @module apps/web/app/auth/signin
 *
 * Custom sign-in page — kid-friendly design with Google OAuth.
 *
 * This page is a static server component. The client-side URL-param reading
 * (callbackUrl, error) is isolated in <SignInContent> and wrapped in
 * <Suspense> so Next.js can pre-render a static shell at build time.
 */

import { Suspense } from "react";
import SignInContent from "./SignInContent";

function LoadingShell() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
        <div className="text-7xl mb-4">🧮</div>
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">MathAI</h1>
        <p className="text-gray-400">Loading…</p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <SignInContent />
    </Suspense>
  );
}
