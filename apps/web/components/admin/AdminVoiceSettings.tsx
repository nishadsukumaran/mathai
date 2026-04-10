"use client";

/**
 * @module components/admin/AdminVoiceSettings
 *
 * Admin-configurable voice engine settings.
 *
 * Controls:
 *   - Engine selection (browser / AI / hybrid)
 *   - Voice style (teacher / friendly / fun)
 *   - Usage scope (questions / explanations / both)
 *   - Daily character budget
 *   - Preview button for each style
 *
 * Settings are saved to env vars via admin API (future) or stored in
 * localStorage as a demonstration. Production deployment would use
 * server-side config (database or env vars).
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  loadVoiceConfig,
  saveVoiceConfigOverride,
  STYLE_VOICE_MAP,
  getCharUsage,
  type VoiceConfig,
  type VoiceEngine,
  type VoiceStyle,
  type VoiceScope,
} from "@/lib/voice/voice-config";
import { speak, stopSpeaking } from "@/lib/voice/provider";

const ENGINE_OPTIONS: { value: VoiceEngine; label: string; desc: string }[] = [
  { value: "browser",  label: "Browser Voice",  desc: "Free, instant. Uses the device's built-in speech." },
  { value: "ai",       label: "AI Voice",       desc: "High quality. Uses ElevenLabs. Requires API key." },
  { value: "hybrid",   label: "Hybrid",         desc: "AI for questions, browser for explanations. Best balance." },
];

const STYLE_OPTIONS: { value: VoiceStyle; label: string; desc: string; icon: string }[] = [
  { value: "teacher",  label: "Teacher",  desc: "Patient, warm, clear",          icon: "👩‍🏫" },
  { value: "friendly", label: "Friendly", desc: "Bright, encouraging",           icon: "😊" },
  { value: "fun",      label: "Fun",      desc: "Playful, animated",             icon: "🎉" },
];

const SCOPE_OPTIONS: { value: VoiceScope; label: string }[] = [
  { value: "questions",    label: "Questions only" },
  { value: "explanations", label: "Explanations only" },
  { value: "both",         label: "Everything" },
];

export function AdminVoiceSettings() {
  const [config, setConfig] = useState<VoiceConfig>(() => loadVoiceConfig());
  const [saved, setSaved]   = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const { used } = getCharUsage();

  const update = (partial: Partial<VoiceConfig>) => {
    setConfig((c) => ({ ...c, ...partial }));
    setSaved(false);
  };

  const handleSave = () => {
    saveVoiceConfigOverride(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreview = (style: VoiceStyle) => {
    stopSpeaking();
    setPreviewing(true);
    const voiceInfo = STYLE_VOICE_MAP[style];
    const text = "Let's work out 27 plus 15. Start with the ones column.";

    speak({
      text,
      context: "question",
      onEnd: () => setPreviewing(false),
      onError: () => setPreviewing(false),
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Voice Engine Settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Configure how MathAI speaks to students.</p>
      </div>

      {/* Engine selection */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Engine</label>
        <div className="grid grid-cols-3 gap-2">
          {ENGINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ engine: opt.value })}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition",
                config.engine === opt.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-100 hover:border-indigo-200",
              )}
            >
              <p className="text-xs font-bold text-gray-800">{opt.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Voice style */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Voice Style</label>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((opt) => {
            const voiceInfo = STYLE_VOICE_MAP[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => update({ style: opt.value })}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition relative",
                  config.style === opt.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-100 hover:border-indigo-200",
                )}
              >
                <span className="text-lg">{opt.icon}</span>
                <p className="text-xs font-bold text-gray-800 mt-1">{opt.label}</p>
                <p className="text-[10px] text-gray-400">{opt.desc}</p>
                <p className="text-[9px] text-gray-300 mt-1">{voiceInfo.label}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreview(opt.value); }}
                  disabled={previewing}
                  className="absolute top-2 right-2 text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 disabled:opacity-40"
                >
                  {previewing ? "..." : "▶ Preview"}
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope (only relevant for hybrid/AI) */}
      {config.engine !== "browser" && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Voice Used For</label>
          <div className="flex gap-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update({ scope: opt.value })}
                className={cn(
                  "flex-1 py-2 rounded-xl border-2 text-xs font-bold text-center transition",
                  config.scope === opt.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-100 text-gray-500 hover:border-indigo-200",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Budget (only relevant for hybrid/AI) */}
      {config.engine !== "browser" && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Daily Character Budget
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1000}
              max={20000}
              step={1000}
              value={config.dailyCharBudget}
              onChange={(e) => update({ dailyCharBudget: Number(e.target.value) })}
              className="flex-1 accent-indigo-600 h-2"
            />
            <span className="text-xs font-bold text-gray-700 min-w-[4ch]">
              {(config.dailyCharBudget / 1000).toFixed(0)}K
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            ~{Math.round(config.dailyCharBudget / 100)} questions per student per day.
            Session usage: {used.toLocaleString()} chars.
          </p>
        </div>
      )}

      {/* Allow student override */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700">Allow students to override</p>
          <p className="text-[10px] text-gray-400">Students can choose browser/AI in their profile</p>
        </div>
        <button
          onClick={() => update({ allowStudentOverride: !config.allowStudentOverride })}
          className={cn(
            "w-10 h-6 rounded-full transition-colors relative",
            config.allowStudentOverride ? "bg-indigo-500" : "bg-gray-200",
          )}
        >
          <span className={cn(
            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
            config.allowStudentOverride ? "translate-x-4" : "translate-x-0.5",
          )} />
        </button>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition",
          saved
            ? "bg-emerald-500 text-white"
            : "bg-indigo-600 text-white hover:bg-indigo-700",
        )}
      >
        {saved ? "✓ Saved" : "Save Voice Settings"}
      </button>
    </div>
  );
}
