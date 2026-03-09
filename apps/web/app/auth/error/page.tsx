"use client";

/**
 * @module apps/web/app/auth/error
 *
 * Auth error page — shown when NextAuth encounters an error.
 */

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorInfo: Record<string, { title: string; message: string }> = {
    Configuration: {
      title: "Server configuration issue",
      message: "There's a problem with the server configuration. Please contact support.",
    },
    AccessDenied: {
      title: "Access denied",
      message: "You don't have permission to sign in. Please contact your teacher or parent.",
    },
    Verification: {
      title: "Link expired",
      message: "The sign-in link has expired or has already been used. Please request a new one.",
    },
    Default: {
      title: "Something went wrong",
      message: "An unexpected error occurred during sign in. Please try again.",
    },
  };

  const info = (error && errorInfo[error]) ?? errorInfo["Default"]!;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{info.title}</h1>
        <p className="text-gray-500 mb-8">{info.message}</p>

        {error && (
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 rounded-lg px-3 py-2">
            Error code: {error}
          </p>
        )}

        <Link
          href="/auth/signin"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition"
        >
          Try signing in again
        </Link>

        <div className="mt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-indigo-500 transition">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
