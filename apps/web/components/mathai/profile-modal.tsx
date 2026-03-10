/**
 * @module components/mathai/profile-modal
 *
 * Student profile modal — shows name, grade, avatar, learning pace,
 * confidence level, and explanation style preference.
 *
 * Wave 1: reads from mock `StudentProfileResponse` fixture.
 * Wave 2: reads from GET /api/profile and submits PATCH /api/profile.
 */

"use client";

import { useState }           from "react";
import { cn }                 from "@/lib/utils";
import type {
  StudentProfileResponse,
  LearningPace,
  ExplanationStyle,
  Grade,
} from "@/types";

// ─── Mock fixture (Wave 1) ────────────────────────────────────────────────────

export const MOCK_PROFILE: StudentProfileResponse = {
  id:                      "mock-student",
  name:                    "Alex",
  grade:                   "G4" as Grade,
  preferredTheme:          "indigo",
  learningPace:            "standard",
  confidenceLevel:         3,
  preferredExplanationStyle: "visual",
  totalXp:                 1240,
  currentLevel:            5,
};

// ─── Config maps ──────────────────────────────────────────────────────────────

const PACE_OPTIONS: { value: LearningPace; label: string; icon: string; desc: string }[] = [
  { value: "slow",     label: "Take It Slow",  icon: "🐢", desc: "More hints & explanations" },
  { value: "standard", label: "Balanced",      icon: "🚶", desc: "Standard pacing"            },
  { value: "fast",     label: "Fast Track",    icon: "🚀", desc: "Challenge me!"              },
];

const STYLE_OPTIONS: { value: ExplanationStyle; label: string; icon: string }[] = [
  { value: "visual",       label: "Visual",       icon: "🎨" },
  { value: "step_by_step", label: "Step by Step", icon: "🪜" },
  { value: "story",        label: "Story",        icon: "📖" },
  { value: "analogy",      label: "Analogy",      icon: "🔗" },
  { value: "direct",       label: "Direct",       icon: "⚡" },
];

const CONFIDENCE_LABELS = ["", "Not sure", "A bit unsure", "OK", "Fairly confident", "Very confident"];

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfileModalProps {
  /** Pass null to use mock fixture */
  profile?:  StudentProfileResponse | null;
  loading?:  boolean;
  onClose:   () => void;
  /** Wave 2: called with changed fields when Save is pressed */
  onSave?:   (patch: Partial<StudentProfileResponse>) => Promise<void>;
  className?: string;
}

export function ProfileModal({
  profile,
  loading = false,
  onClose,
  onSave,
  className,
}: ProfileModalProps) {
  const data = profile ?? MOCK_PROFILE;

  const [pace,       setPace]       = useState<LearningPace>(data.learningPace);
  const [style,      setStyle]      = useState<ExplanationStyle>(data.preferredExplanationStyle);
  const [confidence, setConfidence] = useState<number>(data.confidenceLevel);
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    if (!onSave) { onClose(); return; }
    setSaving(true);
    try {
      await onSave({ learningPace: pace, preferredExplanationStyle: style, confidenceLevel: confidence });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        "bg-black/40 backdrop-blur-sm p-4",
        className,
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-inner">
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                "🧑‍🎓"
              )}
            </div>
            <div>
              <p className="font-black text-xl leading-tight">{data.name}</p>
              <p className="text-indigo-200 text-sm font-medium">Grade {data.grade.replace("G", "")}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-bold">⭐ Level {data.currentLevel}</span>
                <span className="text-xs text-indigo-200">{data.totalXp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin text-3xl">⏳</div>
            </div>
          ) : (
            <>
              {/* Learning pace */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Learning Pace
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPace(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 text-center transition",
                        pace === opt.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-100 hover:border-indigo-200",
                      )}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-xs font-bold text-gray-700 leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation style */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  How I Like to Learn
                </p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStyle(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition",
                        style === opt.value
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-100 text-gray-600 hover:border-purple-200",
                      )}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence slider */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  My Confidence Level
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm font-bold text-indigo-600 w-24 text-right">
                    {CONFIDENCE_LABELS[confidence]}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
                  <span>😟</span>
                  <span>😊</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : "Save ✓"}
          </button>
        </div>

      </div>
    </div>
  );
}
