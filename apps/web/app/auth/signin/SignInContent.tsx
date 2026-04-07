"use client";

/**
 * @module apps/web/app/auth/signin/SignInContent
 *
 * Unified sign-in with segmented Parent / Student tabs.
 * Parent tab: email + password + Google OAuth
 * Student tab: username + PIN (first-class, not buried)
 */

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState }  from "react";
import { useSearchParams }      from "next/navigation";
import Link                     from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "parent" | "student";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:           "Couldn't start sign in. Please try again.",
  OAuthCallback:         "Something went wrong during sign in. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to another account.",
  CredentialsSignin:     "Invalid email or password. Please try again.",
  SessionRequired:       "Please sign in to continue.",
  Default:               "An error occurred. Please try again.",
};

const tabSlide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

export default function SignInContent() {
  const searchParams = useSearchParams();
  const rawCallback  = searchParams.get("callbackUrl");
  const initialMode: AuthMode = searchParams.get("mode") === "student" ? "student" : "parent";
  // Default parents to /parent, students to /dashboard
  const callbackUrl  = rawCallback || (initialMode === "parent" ? "/parent" : "/dashboard");
  const error        = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";

  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to MathAI
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg mx-auto mb-4 shadow-lg shadow-indigo-200">
              M
            </div>
            <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to continue learning</p>
          </div>

          {/* Tab switcher */}
          <div className="px-8 pt-2 pb-6">
            <div className="relative flex bg-gray-100 rounded-xl p-1">
              {/* Sliding indicator */}
              <motion.div
                layoutId="auth-tab-bg"
                className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
                style={{ width: "calc(50% - 4px)" }}
                animate={{ x: mode === "parent" ? 4 : "calc(100% + 4px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button
                onClick={() => setMode("parent")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === "parent" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="text-base">👨‍👩‍👧</span>
                Parent
              </button>
              <button
                onClick={() => setMode("student")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === "student" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="text-base">🧒</span>
                Student
              </button>
            </div>
          </div>

          {/* Banners */}
          <div className="px-8">
            {resetSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">
                Password updated! Sign in with your new password.
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {ERROR_MESSAGES[error] || ERROR_MESSAGES["Default"]}
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {mode === "parent" ? (
                <motion.div key="parent" {...tabSlide}>
                  <ParentForm callbackUrl={callbackUrl} />
                </motion.div>
              ) : (
                <motion.div key="student" {...tabSlide}>
                  <StudentForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sign up prompt */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

// ─── Parent / Email Login Form ───────────────────────────────────────────────

function ParentForm({ callbackUrl }: { callbackUrl: string }) {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { getProviders().then(setProviders); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl });
    setLoading(false);
  };

  const oauthProviders = providers
    ? Object.values(providers).filter((p) => p.type !== "credentials")
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* OAuth */}
      {oauthProviders.length > 0 && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="space-y-2.5">
            {oauthProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition active:scale-[0.98]"
              >
                {provider.id === "google" && (
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with {provider.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Student / PIN Login Form ────────────────────────────────────────────────

function StudentForm() {
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
    <div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-emerald-700 font-medium leading-relaxed">
          Quick and easy login for students. Ask your parent for your username and PIN.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
