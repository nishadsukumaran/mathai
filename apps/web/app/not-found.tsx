/**
 * @module apps/web/app/not-found
 *
 * Custom 404 page — shown whenever a route has no match.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 animate-bounce">🤔</div>
        <h1 className="font-black text-5xl text-indigo-700 mb-3">404</h1>
        <h2 className="font-black text-2xl text-gray-800 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-8">
          Hmm, this page seems to have gone on a math vacation.
          Let&apos;s get you back to the good stuff!
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl"
        >
          Back to Dashboard 🏠
        </Link>
      </div>
    </div>
  );
}
