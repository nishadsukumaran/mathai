"use client";

import { useState } from "react";
import { signIn }   from "next-auth/react";
import Link         from "next/link";

type Role = "parent" | "student";

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
        body: JSON.stringify({ name, email, password, role, grade: role === "student" ? grade : undefined }),
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
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg mx-auto mb-4">M</div>
          <h1 className="text-xl font-bold text-gray-900">Join MathAI</h1>
          <p className="text-sm text-gray-500 mt-1">How will you use MathAI?</p>
        </div>
        <div className="space-y-3">
          <button onClick={() => setRole("parent")}
            className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition active:scale-[0.98] group">
            <div className="flex items-center gap-4">
              <span className="text-2xl shrink-0">👨‍👩‍👧</span>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-emerald-700">Parent / Guardian</p>
                <p className="text-xs text-gray-400 mt-0.5">Set up learning for your child and track their progress</p>
              </div>
            </div>
          </button>
          <button onClick={() => setRole("student")}
            className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition active:scale-[0.98] group">
            <div className="flex items-center gap-4">
              <span className="text-2xl shrink-0">🎓</span>
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
      </Shell>
    );
  }

  /* ── Registration form ───────────────────────────────────────────────── */
  return (
    <Shell>
      <div className="text-center mb-6">
        <button onClick={() => setRole(null)} className="text-xs text-gray-400 hover:text-gray-600 transition mb-3 inline-block">
          &larr; Change role
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {role === "parent" ? "Create Parent Account" : "Create Student Account"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === "parent" ? "You will set up your child next" : "Start your math learning journey"}
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
                    grade === g.value ? "border-indigo-500 bg-indigo-600 text-white" : "border-gray-200 text-gray-600 hover:border-indigo-300"
                  }`}>{g.label}</button>
              ))}
            </div>
          </div>
        )}
        <button type="submit" disabled={loading || !pwMatch}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.98]">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">{children}</div>
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
