"use client";

/**
 * @module apps/web/app/auth/reset-password/page
 *
 * Reset-password page.
 * Reads ?token= and ?email= from the URL (set by the reset link in the email),
 * lets the user enter a new password, and calls POST /api/auth/reset-password.
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter }     from "next/navigation";
import Link                              from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);

  // Redirect to forgot-password if there's no token in the URL
  useEffect(() => {
    if (!token || !email) {
      router.replace("/auth/forgot-password");
    }
  }, [token, email, router]);

  const passwordsMatch = confirmPassword === "" || password === confirmPassword;
  const meetsComplexity = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const isValid = meetsComplexity && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess(true);
      // Redirect to sign-in after a short delay
      setTimeout(() => router.push("/auth/signin?reset=success"), 2500);
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Password updated!</h1>
          <p className="text-gray-500 mb-8">
            Your password has been changed successfully. Taking you to sign in…
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition"
          >
            Sign In Now
          </Link>
        </div>
      </main>
    );
  }

  // ── Password entry form ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-indigo-700 mb-2">Set a new password</h1>
          {email && (
            <p className="text-sm text-gray-500">
              for <span className="font-semibold text-gray-700">{email}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}{" "}
            {(error.includes("invalid") || error.includes("expired")) && (
              <Link href="/auth/forgot-password" className="underline font-semibold">
                Request a new link
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:border-indigo-500 outline-none transition"
                placeholder="At least 8 chars, letters + numbers"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {password.length > 0 && !meetsComplexity && (
              <p className="text-xs text-red-500 mt-1">
                At least 8 characters, including a letter and a number
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className={`w-full border-2 rounded-2xl px-4 py-3 outline-none transition ${
                !passwordsMatch
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-indigo-500"
              }`}
              placeholder="Re-enter your new password"
            />
            {!passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition mt-2"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/signin" className="text-indigo-600 font-semibold hover:underline">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="animate-spin text-4xl">⏳</div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
