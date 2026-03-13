"use client";

/**
 * @module apps/web/app/auth/forgot-password/page
 *
 * Forgot-password page.
 * Accepts an email address and calls POST /api/auth/forgot-password.
 * Always shows a "check your inbox" message after submit (no user enumeration).
 */

import { useState }  from "react";
import Link          from "next/link";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  // In dev, the API returns the reset URL directly so devs can test
  const [devUrl,    setDevUrl]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // Dev only: API returns the URL directly so we can test without SMTP
      if (data.devResetUrl) setDevUrl(data.devResetUrl as string);

      setSubmitted(true);
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Post-submit confirmation screen ─────────────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Check your inbox</h1>
          <p className="text-gray-500 mb-6">
            If an account exists for <span className="font-semibold text-gray-700">{email}</span>,
            you&apos;ll receive a password reset link within a few minutes.
          </p>
          <p className="text-xs text-gray-400 mb-8">
            Didn&apos;t get it? Check your spam folder or{" "}
            <button
              onClick={() => { setSubmitted(false); setDevUrl(null); }}
              className="text-indigo-500 hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>

          {/* DEV ONLY — never shown in production */}
          {devUrl && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                Development — Reset URL (not shown in production)
              </p>
              <a
                href={devUrl}
                className="text-xs text-indigo-600 break-all hover:underline"
              >
                {devUrl}
              </a>
            </div>
          )}

          <Link
            href="/auth/signin"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </main>
    );
  }

  // ── Email entry form ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-indigo-700 mb-2">Forgot your password?</h1>
          <p className="text-gray-500 text-sm">
            No worries — enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-indigo-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Remembered it?{" "}
          <Link href="/auth/signin" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
