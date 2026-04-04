"use client";

/**
 * @module app/auth/pin-login
 *
 * Standalone child-friendly PIN login page.
 * Exists as a direct-access alternative; the main sign-in page also
 * has a Student tab with the same functionality.
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
      const result = await signIn("pin", {
        username: username.trim().toLowerCase(),
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError("Wrong username or PIN. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Could not connect. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-indigo-50/30 p-4">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <div className="text-center mb-6">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All sign-in options
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-emerald-200">
              🧒
            </div>
            <h1 className="text-xl font-bold text-gray-900">Student Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              Log in with your username and PIN
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base text-center font-semibold focus:border-emerald-400 outline-none transition"
              />
            </div>

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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-2xl text-center tracking-[0.5em] font-bold focus:border-emerald-400 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-bold text-base hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400">
            Ask your parent if you need help with your username or PIN.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/auth/signin" className="text-sm text-gray-500 hover:text-indigo-600 font-medium transition">
              Parent / Email Login &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
