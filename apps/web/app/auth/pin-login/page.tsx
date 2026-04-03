"use client";

/**
 * @module app/auth/pin-login
 *
 * Child-friendly PIN login page.
 * Large touch targets, simple layout, kid-safe wording.
 * Uses POST /api/auth/pin-login then signs in via NextAuth credentials.
 */

import { useState } from "react";
import { signIn }   from "next-auth/react";
import Link         from "next/link";

export default function PinLoginPage() {
  const [username, setUsername] = useState("");
  const [pin,      setPin]     = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  const canSubmit = username.trim().length >= 3 && pin.length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the dedicated "pin" NextAuth credentials provider directly.
      // This validates username + PIN server-side and creates a proper session.
      const result = await signIn("pin", {
        username: username.trim().toLowerCase(),
        pin,
        redirect:    false,  // handle errors ourselves for child-friendly messages
      });

      if (result?.error) {
        // NextAuth returns error="CredentialsSignin" for failed authorize()
        setError("Wrong username or PIN. Please try again.");
        setLoading(false);
        return;
      }

      // Success — redirect to student dashboard
      window.location.href = "/dashboard";
    } catch {
      setError("Could not connect. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-indigo-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">

        {/* Header */}
        <div className="mb-8">
          <div className="text-5xl mb-3">🧒</div>
          <h1 className="text-xl font-bold text-gray-900">Student Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Log in with your username and PIN
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-left">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. aryan-472"
              autoFocus
              autoComplete="username"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-base text-center font-semibold focus:border-emerald-400 outline-none transition"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-left">
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
              autoComplete="current-password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-2xl text-center tracking-[0.5em] font-bold focus:border-emerald-400 outline-none transition"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-base hover:bg-emerald-700 disabled:opacity-40 transition active:scale-[0.98]"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Help text */}
        <p className="mt-6 text-xs text-gray-400">
          Ask your parent if you need help with your username or PIN.
        </p>

        {/* Back to main login */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link href="/auth/signin" className="text-sm text-gray-500 hover:text-indigo-600 font-medium transition">
            Parent / Email Login &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
