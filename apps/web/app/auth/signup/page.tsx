"use client";

/**
 * @module app/auth/signup
 *
 * Sign-up page — role selector → registration form.
 * Visual design aligned with the unified MathAI auth system.
 */

import { useState, useEffect, useRef } from "react";
import { signIn }   from "next-auth/react";
import Link         from "next/link";

type Role = "parent" | "student";

const TURNSTILE_SITE_KEY = process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"] ?? "";

const GRADES = [
  { value: "G1", label: "Grade 1" }, { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" }, { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" }, { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7" }, { value: "G8", label: "Grade 8" },
];

export default function SignUpPage() {
  const [role,            setRole]            = useState<Role | null>(null);
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grade,           setGrade]           = useState("G4");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [turnstileToken,  setTurnstileToken]  = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!role || !TURNSTILE_SITE_KEY || !turnstileRef.current) return;
    const w = window as any;
    if (w.turnstile) {
      w.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        theme: "light",
        size: "flexible",
      });
    }
  }, [role]);

  const pwMatch = !confirmPassword || confirmPassword === password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!role) { setError("Please select how you will use MathAI."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 characters with a letter and a number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password, role,
          grade: role === "student" ? grade : undefined,
          turnstileToken: turnstileToken || undefined,
          website: (document.getElementById("hp-website") as HTMLInputElement)?.value || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
      const callbackUrl = role === "parent" ? "/parent/onboarding" : "/dashboard";
      await signIn("credentials", { email, password, callbackUrl });
    } catch {
      setError("Could not connect to the server");
      setLoading(false);
    }
  };

  /* ── Role selection ──────────────────────────────────────────────────── */
  if (!role) {
    return (
      <Shell>
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

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg mx-auto mb-4 shadow-lg shadow-indigo-200">
                M
              </div>
              <h1 className="text-xl font-bold text-gray-900">Join MathAI</h1>
              <p className="text-sm text-gray-500 mt-1">How will you use MathAI?</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => setRole("parent")}
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition active:scale-[0.98] group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="text-xl">👨‍👩‍👧</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-emerald-700">Parent / Guardian</p>
                    <p className="text-xs text-gray-400 mt-0.5">Set up learning for your child and track their progress</p>
                  </div>
                </div>
              </button>
              <button onClick={() => setRole("student")}
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition active:scale-[0.98] group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="text-xl">🎓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-700">Student</p>
                    <p className="text-xs text-gray-400 mt-0.5">Practice maths and learn with AI-powered tutoring</p>
                  </div>
                </div>
              </button>
            </div>
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Registration form ───────────────────────────────────────────────── */
  return (
    <Shell>
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

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          <div className="text-center mb-6">
            <button onClick={() => setRole(null)} className="text-xs text-gray-400 hover:text-gray-600 transition mb-3 inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Change role
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {role === "parent" ? "Create Parent Account" : "Create Student Account"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {role === "parent" ? "You'll set up your child's profile next" : "Start your math learning journey"}
            </p>
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InpField label="Name" type="text" value={name} onChange={setName} ph="Your name" />
            <InpField label="Email" type="email" value={email} onChange={setEmail} ph="you@example.com" />
            <InpField label="Password" type="password" value={password} onChange={setPassword} ph="8+ chars, letters + numbers" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                placeholder="Re-enter password"
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition ${!pwMatch ? "border-red-400" : "border-gray-200 focus:border-indigo-400"}`} />
              {!pwMatch && <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>}
            </div>
            {role === "student" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Grade</label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADES.map((g) => (
                    <button key={g.value} type="button" onClick={() => setGrade(g.value)}
                      className={`py-2 rounded-lg border-2 text-xs font-semibold transition active:scale-[0.95] ${
                        grade === g.value ? "border-indigo-500 bg-gradient-to-r from-indigo-600 to-violet-600 text-white" : "border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}>{g.label}</button>
                  ))}
                </div>
              </div>
            )}
            {/* Honeypot */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input id="hp-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {TURNSTILE_SITE_KEY && <div ref={turnstileRef} className="mb-2" />}

            <button type="submit" disabled={loading || !pwMatch}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-40 transition-all active:scale-[0.98]">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {TURNSTILE_SITE_KEY && (
            <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 p-4">
      {children}
    </main>
  );
}

function InpField({ label, type, value, onChange, ph }: {
  label: string; type: string; value: string; onChange: (v: string) => void; ph: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} required
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition" />
    </div>
  );
}
