"use client";

/**
 * @module app/parent/onboarding/page
 *
 * Two-step parent onboarding flow:
 *   Step 1: Child name + grade + curriculum (required)
 *   Step 2: Learning goal (optional, skippable)
 *
 * Designed for < 60 seconds completion. Mobile-friendly.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADES = [
  { value: "G1",  label: "Grade 1" },
  { value: "G2",  label: "Grade 2" },
  { value: "G3",  label: "Grade 3" },
  { value: "G4",  label: "Grade 4" },
  { value: "G5",  label: "Grade 5" },
  { value: "G6",  label: "Grade 6" },
  { value: "G7",  label: "Grade 7" },
  { value: "G8",  label: "Grade 8" },
];

const CURRICULA = [
  { value: "cambridge",    label: "Cambridge" },
  { value: "ib",           label: "IB" },
  { value: "cbse",         label: "CBSE" },
  { value: "icse",         label: "ICSE" },
  { value: "british",      label: "British (General)" },
  { value: "american",     label: "American" },
  { value: "other",        label: "Other" },
];

const GOALS = [
  { value: "improve_grades",     label: "Improve grades",      icon: "📈" },
  { value: "build_confidence",   label: "Build confidence",    icon: "💪" },
  { value: "practice_regularly", label: "Practice regularly",  icon: "📅" },
  { value: "prepare_exams",      label: "Prepare for exams",   icon: "📝" },
  { value: "exploring",          label: "Just exploring",      icon: "🔍" },
];

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [childName,   setChildName]   = useState("");
  const [grade,       setGrade]       = useState("G4");
  const [curriculum,  setCurriculum]  = useState("cambridge");
  const [schoolName,  setSchoolName]  = useState("");

  // Step 2 field
  const [goal, setGoal] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const canProceed = childName.trim().length >= 1 && grade && curriculum;

  async function handleSubmit(skipGoal = false) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/parent-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName:      childName.trim(),
          grade,
          curriculum,
          schoolName:     schoolName.trim() || undefined,
          onboardingGoal: skipGoal ? undefined : (goal ?? undefined),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Success — redirect to parent dashboard with new child ID
      const childId = data.childId;
      router.push(`/parent/dashboard?childId=${childId}`);
    } catch {
      setError("Could not connect to server. Please try again.");
      setLoading(false);
    }
  }

  // ── Step 1: Child Profile ─────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-8">
            <div className="flex-1 h-1 rounded-full bg-indigo-500" />
            <div className="flex-1 h-1 rounded-full bg-gray-200" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Set up your child&apos;s learning
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            This takes about 30 seconds. You can update everything later.
          </p>

          <div className="space-y-4">
            {/* Child Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Child&apos;s Name
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Aryan"
                autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition bg-white"
              >
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Curriculum */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Curriculum
              </label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition bg-white"
              >
                {CURRICULA.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* School Name (optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                School Name <span className="text-gray-300 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Dubai International Academy"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-400 outline-none transition"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.98]"
            >
              Continue
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
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Help us personalise learning
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Why are you using MathAI? This helps us tailor the experience.
        </p>

        <div className="space-y-2 mb-6">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGoal(goal === g.value ? null : g.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition active:scale-[0.98] ${
                goal === g.value
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-200"
              }`}
            >
              <span className="text-xl">{g.icon}</span>
              <span className="text-sm font-medium text-gray-700">{g.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
        )}

        <div className="space-y-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition active:scale-[0.98]"
          >
            {loading ? "Setting up..." : "Get Started"}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="w-full text-gray-400 py-2 text-sm font-medium hover:text-gray-600 transition"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
