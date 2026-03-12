"use client";
/**
 * Error boundary for /ask route.
 * Catches server-side and client-side errors so users see a friendly
 * recovery UI instead of the raw Next.js "Application error" page.
 */

import { useEffect } from "react";
import { useRouter }  from "next/navigation";

interface ErrorProps {
  error:  Error & { digest?: string };
  reset:  () => void;
}

export default function AskError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log to console so it shows up in Vercel / server logs
    console.error("[/ask] Caught error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="text-4xl">🤖</div>
        <h1 className="text-xl font-semibold text-gray-800">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500">
          MathAI hit an unexpected error loading this page. You can try again
          or go back to practice.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/practice")}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            Back to practice
          </button>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 pt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
