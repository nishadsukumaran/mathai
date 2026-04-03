"use client";

/**
 * @module app/parent/onboarding/page
 *
 * Parent onboarding — creates a child account with proper ParentChildLink.
 *
 * Step 1: Child name + grade + curriculum + login mode (+ optional PIN)
 * Step 2: Learning goal (optional, skippable)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const GRADES = [
  { value: "G1", label: "Grade 1" }, { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" }, { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" }, { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7" }, { value: "G8", label: "Grade 8" },
];

const CURRICULA = [
  { value: "cambridge", label: "Cambridge" }, { value: "ib", label: "IB" },
  { value: "cbse", label: "CBSE" },          { value: "icse", label: "ICSE" },
  { value: "british", label: "British" },     { value: "american", label: "American" },
  { value: "other", label: "Other" },
];

const LOGIN_MODES = [
  { value: "parent_managed", label: "Parent account only",    desc: "You launch learning for your child" },
  { value: "hybrid",         label: "Parent + child PIN",     desc: "Child can also log in independently" },
  { value: "pin_only",       label: "Child PIN login only",   desc: "Child logs in with username and PIN" },
];

const GOALS = [
  { value: "improve_grades",     label: "Improve grades",     icon: "📈" },
  { value: "build_confidence",   label: "Build confidence",   icon: "💪" },
  { value: "practice_regularly", label: "Practice regularly", icon: "📅" },
  { value: "prepare_exams",      label: "Prepare for exams",  icon: "📝" },
  { value: "exploring",          label: "Just exploring",     icon: "🔍" },
];

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [childName,  setChildName]  = useState("");
  const [grade,      setGrade]      = useState("G4");
  const [curriculum, setCurriculum] = useState("cambridge");
  const [schoolName, setSchoolName] = useState("");
  const [loginMode,  setLoginMode]  = useState("parent_managed");
  const [pin,        setPin]        = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [username,   setUsername]   = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameSuggestion, setUsernameSuggestion] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout>>();

  // Step 2
  const [goal, setGoal] = useState<string | null>(null);

  // Step 3 (confirmation)
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdChildId, setCreatedChildId]     = useState<string | null>(null);
  const [createdUsername, setCreatedUsername]     = useState<string | null>(null);

  // State
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const needsPin = loginMode === "pin_only" || loginMode === "hybrid";
  const usernameValid = !needsPin || (usernameStatus === "available" && username.length >= 3);
  const canProceed = childName.trim().length >= 1 && grade && curriculum &&
    (!needsPin || (pin.length >= 4 && pin === pinConfirm && usernameValid));

  // ── Username availability check (debounced) ───────────────────────────
  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setUsernameStatus("idle");
      setUsernameError(value.length > 0 ? "At least 3 characters" : null);
      setUsernameSuggestion(null);
      return;
    }
    setUsernameStatus("checking");
    setUsernameError(null);
    setUsernameSuggestion(null);
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value.toLowerCase())}`);
      const data = await res.json();
      if (data.available) {
        setUsernameStatus("available");
        setUsernameError(null);
      } else {
        setUsernameStatus("taken");
        setUsernameError(data.error ?? "Not available");
        setUsernameSuggestion(data.suggestion ?? null);
      }
    } catch {
      setUsernameStatus("idle");
      setUsernameError("Could not check");
    }
  }, []);

  function handleUsernameChange(value: string) {
    // Only allow lowercase letters, numbers, hyphens
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 15);
    setUsername(clean);
    setUsernameStatus("idle");
    clearTimeout(checkTimer.current);
    if (clean.length >= 3) {
      checkTimer.current = setTimeout(() => checkUsername(clean), 400);
    }
  }

  async function handleSubmit(skipGoal = false) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/parent-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: childName.trim(), grade, curriculum,
          schoolName: schoolName.trim() || undefined,
          onboardingGoal: skipGoal ? undefined : (goal ?? undefined),
          loginMode,
          username: needsPin ? username.toLowerCase() : undefined,
          pin: needsPin && pin ? pin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return; }

      // Show confirmation with credentials if PIN login was set up
      if (needsPin && data.username) {
        setCreatedChildId(data.childId);
        setCreatedUsername(data.username);
        setShowConfirmation(true);
        setLoading(false);
        return;
      }

      router.push(`/parent/dashboard?childId=${data.childId}`);
    } catch {
      setError("Could not connect. Please try again.");
      setLoading(false);
    }
  }

  // ── Step 1: Child Profile ─────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            <div className="flex-1 h-1 rounded-full bg-indigo-500" />
            <div className="flex-1 h-1 rounded-full bg-gray-200" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Set up your child&apos;s learning</h1>
          <p className="text-sm text-gray-500 mb-6">Takes about 30 seconds. Everything can be updated later.</p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Child&apos;s Name</label>
              <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Aryan" autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition" />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition bg-white">
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            {/* Curriculum */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Curriculum</label>
              <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition bg-white">
                {CURRICULA.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* School (optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                School <span className="text-gray-300 normal-case">(optional)</span>
              </label>
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Dubai International Academy"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition" />
            </div>

            {/* Login mode */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">How will your child access MathAI?</label>
              <div className="space-y-2">
                {LOGIN_MODES.map((m) => (
                  <button key={m.value} onClick={() => setLoginMode(m.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition active:scale-[0.98] ${
                      loginMode === m.value ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
                    }`}>
                    <p className="text-sm font-medium text-gray-700">{m.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Username + PIN setup (if needed) */}
            {needsPin && (
              <div className="space-y-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Child Login Credentials</p>

                {/* Username — parent chooses, we check availability */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-500 mb-1.5">
                    Username <span className="text-indigo-300 font-normal">(your child will type this to log in)</span>
                  </label>
                  <div className="relative">
                    <input type="text" value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="e.g. aryan or neela-math"
                      maxLength={15}
                      autoComplete="off"
                      className={`w-full border-2 rounded-lg px-4 py-2.5 text-sm outline-none transition pr-10 ${
                        usernameStatus === "available" ? "border-emerald-400 bg-emerald-50/50" :
                        usernameStatus === "taken" ? "border-red-300 bg-red-50/50" :
                        "border-indigo-200 focus:border-indigo-400"
                      }`} />
                    {/* Status indicator */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                      {usernameStatus === "checking" && <span className="text-gray-400 animate-pulse">...</span>}
                      {usernameStatus === "available" && <span className="text-emerald-500">&#10003;</span>}
                      {usernameStatus === "taken" && <span className="text-red-400">&#10007;</span>}
                    </span>
                  </div>
                  {usernameError && (
                    <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                  )}
                  {usernameSuggestion && usernameStatus === "taken" && (
                    <button type="button"
                      onClick={() => { handleUsernameChange(usernameSuggestion); }}
                      className="text-xs text-indigo-500 mt-1 hover:underline">
                      Try: <strong>{usernameSuggestion}</strong>
                    </button>
                  )}
                  <p className="text-[10px] text-indigo-400 mt-1">
                    3-15 characters. Letters, numbers, and hyphens. Must start with a letter.
                  </p>
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-500 mb-1.5">PIN</label>
                  <input type="password" inputMode="numeric" maxLength={6} value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="4+ digit PIN"
                    className="w-full border-2 border-indigo-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 outline-none transition text-center tracking-widest" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-500 mb-1.5">Confirm PIN</label>
                  <input type="password" inputMode="numeric" maxLength={6} value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    placeholder="Confirm PIN"
                    className="w-full border-2 border-indigo-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-400 outline-none transition text-center tracking-widest" />
                  {pin && pinConfirm && pin !== pinConfirm && (
                    <p className="text-red-500 text-xs mt-1">PINs don&apos;t match</p>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button onClick={() => setStep(2)} disabled={!canProceed}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.98]">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmation screen (shown after account creation with PIN) ─────

  if (showConfirmation && createdUsername && createdChildId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 space-y-5">
            <p className="text-4xl">🎉</p>
            <h1 className="text-xl font-bold text-gray-900">{childName}&apos;s account is ready!</h1>
            <p className="text-sm text-gray-500">
              Save these login details — your child will need them to log in independently.
            </p>

            {/* Credentials card */}
            <div className="bg-emerald-50 rounded-xl p-5 space-y-3 text-left border border-emerald-200">
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Username</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5 font-mono">{createdUsername}</p>
              </div>
              <div className="h-px bg-emerald-200" />
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">PIN</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5 tracking-widest">{"*".repeat(pin.length)}</p>
                <p className="text-[10px] text-emerald-500 mt-0.5">The PIN you set during setup</p>
              </div>
              <div className="h-px bg-emerald-200" />
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Login page</p>
                <p className="text-sm font-medium text-indigo-600 mt-0.5">mathai-web.vercel.app/auth/pin-login</p>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              You can always reset the PIN from the parent dashboard.
            </p>

            <button
              onClick={() => router.push(`/parent/dashboard?childId=${createdChildId}`)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition active:scale-[0.98]">
              Go to Parent Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Learning Goal (optional) ──────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Help us personalise learning</h1>
        <p className="text-sm text-gray-500 mb-6">Why are you using MathAI? This helps us tailor the experience.</p>

        <div className="space-y-2 mb-6">
          {GOALS.map((g) => (
            <button key={g.value} onClick={() => setGoal(goal === g.value ? null : g.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition active:scale-[0.98] ${
                goal === g.value ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
              }`}>
              <span className="text-xl">{g.icon}</span>
              <span className="text-sm font-medium text-gray-700">{g.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm font-medium mb-3">{error}</p>}

        <div className="space-y-2">
          <button onClick={() => handleSubmit(false)} disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.98]">
            {loading ? "Setting up..." : "Get Started"}
          </button>
          <button onClick={() => handleSubmit(true)} disabled={loading}
            className="w-full text-gray-400 py-2 text-sm font-medium hover:text-gray-600 transition">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
