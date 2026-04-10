/**
 * @module lib/voice/voice-config
 *
 * Configuration for the dual voice engine (browser + AI).
 *
 * ─── Engine modes ────────────────────────────────────────────────────────
 *   "browser"  — Web Speech API only (free, offline TTS, zero cost)
 *   "ai"       — AI TTS only (ElevenLabs / OpenAI — high quality, paid)
 *   "hybrid"   — AI for questions, browser for everything else (cost-balanced)
 *
 * ─── Voice styles ────────────────────────────────────────────────────────
 *   "teacher"  — patient, warm, clear (default — best for learning)
 *   "friendly" — upbeat, encouraging (slightly faster, more energy)
 *   "fun"      — playful, animated (best for younger kids)
 *
 * ─── Usage scope ─────────────────────────────────────────────────────────
 *   "questions"     — AI voice reads questions only
 *   "explanations"  — AI voice reads explanations/answers only
 *   "both"          — AI voice for everything
 *
 * ─── Cost control ────────────────────────────────────────────────────────
 *   dailyCharBudget: max chars per student per day sent to AI TTS
 *   When budget exhausted, falls back to browser TTS silently.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type VoiceEngine = "browser" | "ai" | "hybrid";
export type VoiceStyle  = "teacher" | "friendly" | "fun";
export type VoiceScope  = "questions" | "explanations" | "both";

export interface VoiceConfig {
  engine:          VoiceEngine;
  style:           VoiceStyle;
  scope:           VoiceScope;
  dailyCharBudget: number;
  aiVoiceId:       string;
  allowStudentOverride: boolean;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  engine:               "browser",
  style:                "teacher",
  scope:                "questions",
  dailyCharBudget:      5000,
  aiVoiceId:            "",
  allowStudentOverride: false,
};

// ─── Voice style → ElevenLabs voice ID mapping ─────────────────────────────

export const STYLE_VOICE_MAP: Record<VoiceStyle, { voiceId: string; label: string }> = {
  teacher:  { voiceId: "EXAVITQu4vr4xnSDxMaL",  label: "Sarah (warm, clear)" },
  friendly: { voiceId: "jBpfAFnaylXJzIIjcRWl",  label: "Aria (bright, encouraging)" },
  fun:      { voiceId: "onwK4e9ZLuTAKqWW03F9",  label: "Daniel (playful, animated)" },
};

// ─── Config resolution ──────────────────────────────────────────────────────

const STORAGE_KEY = "mathai-voice-config";

export function loadVoiceConfig(): VoiceConfig {
  const base = loadFromEnv();
  if (typeof window === "undefined") return base;

  if (base.allowStudentOverride) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const override = JSON.parse(stored) as Partial<VoiceConfig>;
        return { ...base, ...override };
      }
    } catch { /* malformed JSON */ }
  }

  return base;
}

export function saveVoiceConfigOverride(partial: Partial<VoiceConfig>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch { /* quota exceeded */ }
}

function loadFromEnv(): VoiceConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env as any : {};
  return {
    engine: (env["NEXT_PUBLIC_VOICE_ENGINE"] as VoiceEngine) || DEFAULT_VOICE_CONFIG.engine,
    style:  (env["NEXT_PUBLIC_VOICE_STYLE"]  as VoiceStyle)  || DEFAULT_VOICE_CONFIG.style,
    scope:  (env["NEXT_PUBLIC_VOICE_SCOPE"]  as VoiceScope)  || DEFAULT_VOICE_CONFIG.scope,
    dailyCharBudget: parseInt(env["NEXT_PUBLIC_VOICE_DAILY_BUDGET"] ?? "", 10) || DEFAULT_VOICE_CONFIG.dailyCharBudget,
    aiVoiceId: env["NEXT_PUBLIC_VOICE_AI_VOICE_ID"] ?? DEFAULT_VOICE_CONFIG.aiVoiceId,
    allowStudentOverride: env["NEXT_PUBLIC_VOICE_ALLOW_OVERRIDE"] === "true",
  };
}

// ─── Budget tracking ────────────────────────────────────────────────────────

let sessionCharsUsed = 0;

export function trackCharUsage(chars: number): void {
  sessionCharsUsed += chars;
}

export function isWithinBudget(config: VoiceConfig, textLength: number): boolean {
  if (config.dailyCharBudget <= 0) return true;
  return sessionCharsUsed + textLength <= config.dailyCharBudget;
}

export function getCharUsage(): { used: number } {
  return { used: sessionCharsUsed };
}

// ─── Routing decision ───────────────────────────────────────────────────────

export function resolveEngine(
  config: VoiceConfig,
  context: "question" | "explanation" | "raw",
  textLength: number,
): "browser" | "ai" {
  if (config.engine === "browser") return "browser";

  if (config.engine === "ai") {
    return isWithinBudget(config, textLength) ? "ai" : "browser";
  }

  if (config.engine === "hybrid") {
    const scopeMatch =
      config.scope === "both" ||
      (config.scope === "questions" && context === "question") ||
      (config.scope === "explanations" && context === "explanation");

    if (scopeMatch && isWithinBudget(config, textLength)) return "ai";
    return "browser";
  }

  return "browser";
}
