/**
 * @module app/profile/ProfilePageContent
 *
 * Full profile settings page — name, grade, learning pace, explanation style,
 * confidence level. Persists via PATCH /api/profile.
 */

"use client";

import { useState, useEffect }  from "react";
import { useSession }           from "next-auth/react";
import { cn }                   from "@/lib/utils";
import { useProfile }           from "@/hooks/use-profile";
import type {
  LearningPace,
  ExplanationStyle,
  Grade,
} from "@/types";

const GRADES: { value: Grade; label: string }[] = [
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7" },
  { value: "G8", label: "Grade 8" },
  { value: "G9", label: "Grade 9" },
  { value: "G10", label: "Grade 10" },
];

const PACE_OPTIONS: { value: LearningPace; label: string; icon: string; desc: string }[] = [
  { value: "slow",     label: "Take It Slow",  icon: "🐢", desc: "More hints & explanations" },
  { value: "standard", label: "Balanced",      icon: "🚶", desc: "Standard pacing" },
  { value: "fast",     label: "Fast Track",    icon: "🚀", desc: "Challenge me!" },
];

const STYLE_OPTIONS: { value: ExplanationStyle; label: string; icon: string; desc: string }[] = [
  { value: "visual",       label: "Visual",       icon: "🎨", desc: "Diagrams & pictures"      },
  { value: "step_by_step", label: "Step by Step", icon: "🪜", desc: "Numbered instructions"    },
  { value: "story",        label: "Story",        icon: "📖", desc: "Real-world scenarios"     },
  { value: "analogy",      label: "Analogy",      icon: "🔗", desc: "Familiar comparisons"     },
  { value: "direct",       label: "Direct",       icon: "⚡", desc: "Concise & to the point"  },
];

export default function ProfilePageContent() {
  const { profile, loading, saving, save, error: profileError } = useProfile();
  const { update: updateSession } = useSession();
  // Separate save-error from load-error so we can block the form on load failure
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name,       setName]       = useState("");
  const [grade,      setGrade]      = useState<Grade>("G4");
  const [pace,       setPace]       = useState<LearningPace>("standard");
  const [style,      setStyle]      = useState<ExplanationStyle>("visual");
  const [confidence, setConfidence] = useState<number>(3);
  const [saved,      setSaved]      = useState(false);

  // Populate from loaded profile
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setGrade(profile.grade as Grade);
      setPace(profile.learningPace);
      setStyle(profile.preferredExplanationStyle);
      // DB stores confidenceLevel on a 0–100 EWMA scale.
      // The UI slider uses 1–5. Map and clamp accordingly.
      const raw = profile.confidenceLevel ?? 60;
      setConfidence(Math.max(1, Math.min(5, Math.round(raw / 20))));
    }
  }, [profile]);

  async function handleSave() {
    setSaveError(null);
    const updated = await save({
      name:                      name.trim() || undefined,
      grade,
      learningPace:              pace,
      preferredExplanationStyle: style,
      confidenceLevel:           confidence,
    });
    if (updated) {
      // Sync the new grade into the NextAuth JWT so subsequent
      // API calls (practice sessions, hints) use the correct grade.
      await updateSession({ grade });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError("Could not save your profile. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  // Profile failed to load — show error and block the form so the user
  // can't accidentally overwrite their real data with empty defaults.
  if (profileError && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-md border border-red-100">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-black text-gray-800 mb-2">Could not load your profile</h2>
          <p className="text-gray-500 text-sm mb-6">
            Please check your connection and try again. Your existing settings are safe.
          </p>
          <a
            href="/profile"
            className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 bg-white rounded-3xl p-6 shadow-md border border-indigo-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg shrink-0">
            {name?.[0]?.toUpperCase() ?? profile?.name?.[0]?.toUpperCase() ?? "S"}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              maxLength={80}
              className="w-full font-black text-2xl text-gray-800 bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none transition pb-0.5"
            />
            <p className="text-slate-500 text-sm mt-1">⭐ Level {profile?.currentLevel ?? 1} · {(profile?.totalXp ?? 0).toLocaleString()} XP</p>
          </div>
        </div>

        {/* Grade */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">My Grade</p>
          <div className="grid grid-cols-5 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.value}
                onClick={() => setGrade(g.value)}
                className={cn(
                  "py-2.5 rounded-2xl border-2 text-sm font-bold transition",
                  grade === g.value
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-md"
                    : "border-gray-100 text-gray-600 hover:border-indigo-300",
                )}
              >
                {g.label.replace("Grade ", "G")}
              </button>
            ))}
          </div>
        </section>

        {/* Learning pace */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Learning Pace</p>
          <div className="grid grid-cols-3 gap-3">
            {PACE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPace(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-center transition",
                  pace === opt.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-100 hover:border-indigo-200",
                )}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Explanation style */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">How I Like to Learn</p>
            <p className="text-xs text-slate-400 mt-0.5">MathAI will adapt its explanations to match your style</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStyle(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition",
                  style === opt.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-100 hover:border-purple-200",
                )}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Confidence */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">My Confidence Level</p>
            <p className="text-xs text-slate-400 mt-0.5">Helps MathAI decide when to offer hints vs. push you harder</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl">😟</span>
            <input
              type="range"
              min={1}
              max={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="flex-1 accent-indigo-600 h-2"
            />
            <span className="text-xl">😊</span>
          </div>
          <p className="text-center text-sm font-bold text-indigo-600">
            {["", "Not sure yet", "Getting there", "Doing OK", "Fairly confident", "Very confident"][confidence]}
          </p>
        </section>

        {/* Save error */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-semibold">
            ⚠️ {saveError} — please try again.
          </div>
        )}

        {/* Save button */}
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-base transition shadow-md",
            saving
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : saved
              ? "bg-emerald-500 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700",
          )}
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
        </button>

      </div>
    </div>
  );
}
