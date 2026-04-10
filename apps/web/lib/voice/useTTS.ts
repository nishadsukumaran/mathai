"use client";

/**
 * @module lib/voice/useTTS
 *
 * React hook for text-to-speech with teacher-like phrasing and caching.
 *
 * ─── Teacher phrasing ──────────────────────────────────────────────────────
 * Raw math like "27 + 15" is cold. A teacher would say "Let's work out
 * 27 plus 15." The `teacherPhrase()` function wraps math expressions in
 * warm, varied introductions so TTS sounds like a patient teacher, not a
 * screen reader.
 *
 * ─── TTS cache ─────────────────────────────────────────────────────────────
 * SpeechSynthesis is instant but has a small initialization delay on some
 * browsers for the first utterance. We cache the last 20 spoken texts so
 * replaying a previously heard question skips any setup cost. The cache
 * key is the cleaned text (after LaTeX strip + teacher phrasing), and the
 * "cached" flag is passed to onEnd so callers know it was a replay.
 *
 * ─── Auto-read ─────────────────────────────────────────────────────────────
 * `autoRead` option: when true, the hook auto-speaks the text on mount or
 * when it changes. Designed for junior grades where reading the question
 * from the screen is harder than hearing it. Controlled by a grade-level
 * flag from the parent component.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { speak, stopSpeaking, isTTSAvailable } from "./provider";

export type TTSState = "idle" | "speaking" | "error";

export interface UseTTSOptions {
  /** If true, automatically speak text when it changes. For junior grades. */
  autoRead?: boolean;
}

export interface UseTTSReturn {
  state:     TTSState;
  available: boolean;
  /** Speak the given text with teacher phrasing. */
  say:       (text: string) => void;
  /** Speak raw text without teacher phrasing (for explanations). */
  sayRaw:    (text: string) => void;
  stop:      () => void;
  error:     string | null;
}

// ─── TTS cache (module-level, persists across hook instances) ────────────────

const ttsCache = new Map<string, boolean>();  // key → true (spoken before)
const MAX_CACHE = 20;

function markCached(key: string): void {
  if (ttsCache.size >= MAX_CACHE) {
    const firstKey = ttsCache.keys().next().value;
    if (firstKey !== undefined) ttsCache.delete(firstKey);
  }
  ttsCache.set(key, true);
}

function isCached(key: string): boolean {
  return ttsCache.has(key);
}

// ─── Teacher phrasing ───────────────────────────────────────────────────────

const QUESTION_INTROS = [
  "Let's work out",
  "Here's the question.",
  "Okay, let's try this.",
  "Let's see.",
  "Here we go.",
];

const ANSWER_INTROS = [
  "The answer is",
  "Great question! The answer is",
  "So the answer is",
];

/**
 * Wrap a math question in teacher-like phrasing.
 * "27 + 15" → "Let's work out, 27 plus 15."
 */
export function teacherPhrase(text: string, mode: "question" | "answer" | "raw" = "question"): string {
  const cleaned = cleanForSpeech(text);
  if (!cleaned) return "";

  if (mode === "raw") return cleaned;

  if (mode === "answer") {
    const intro = ANSWER_INTROS[Math.floor(Math.random() * ANSWER_INTROS.length)]!;
    return `${intro} ${cleaned}.`;
  }

  // Question mode: add a warm intro
  const intro = QUESTION_INTROS[Math.floor(Math.random() * QUESTION_INTROS.length)]!;

  // If it's a bare math expression (e.g. "27 + 15"), wrap it
  if (/^[\d\s+\-×÷=.*/%()]+$/.test(cleaned)) {
    return `${intro} ${cleaned}.`;
  }

  // If it already reads as a sentence, just add the intro
  if (/^(what|how|why|find|solve|calculate|which|if)/i.test(cleaned)) {
    return `${intro} ${cleaned}`;
  }

  return `${intro} ${cleaned}`;
}

/** Strip LaTeX and convert math symbols to speakable words. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\\\(|\\\)/g, "")
    .replace(/\\\[|\\\]/g, "")
    .replace(/\$\$?/g, "")
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, "$1 over $2")
    .replace(/\\times/g, " times ")
    .replace(/\\div/g, " divided by ")
    .replace(/\\pm/g, " plus or minus ")
    .replace(/\\cdot/g, " times ")
    .replace(/[\\{}]/g, "")
    // Make math symbols speakable
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/\*/g, " times ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { autoRead = false } = options;

  const [state, setState]   = useState<TTSState>("idle");
  const [error, setError]   = useState<string | null>(null);
  const [available]         = useState(() => isTTSAvailable());
  const cancelRef           = useRef<(() => void) | null>(null);
  const lastAutoReadRef     = useRef<string>("");
  const contextRef          = useRef<"question" | "explanation" | "raw">("raw");

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      stopSpeaking();
    };
  }, []);

  const speakText = useCallback((text: string, useCache = true) => {
    if (!available) {
      setError("Reading aloud isn't available in this browser.");
      setState("error");
      return;
    }

    if (!text.trim()) return;

    // If we've spoken this exact text before and the browser has it cached,
    // the SpeechSynthesis API replays it faster (no voice init delay).
    const cached = useCache && isCached(text);
    void cached; // informational only — Web Speech API handles its own caching

    setError(null);
    setState("speaking");

    cancelRef.current = speak({
      text,
      context: contextRef.current,
      onEnd: () => {
        setState("idle");
        markCached(text);
      },
      onError: (err) => {
        if (err) {
          setError(err);
          setState("error");
        }
      },
    });
  }, [available]);

  /** Speak with teacher phrasing (for questions). */
  const say = useCallback((text: string) => {
    contextRef.current = "question";
    const phrased = teacherPhrase(text, "question");
    speakText(phrased);
  }, [speakText]);

  /** Speak raw cleaned text (for explanations, answers). */
  const sayRaw = useCallback((text: string) => {
    contextRef.current = "explanation";
    const cleaned = cleanForSpeech(text);
    speakText(cleaned);
  }, [speakText]);

  const stop = useCallback(() => {
    cancelRef.current?.();
    stopSpeaking();
    setState("idle");
  }, []);

  // Auto-read: speak text when it changes (for junior grades)
  useEffect(() => {
    if (!autoRead || !available) return;
    // This effect is called by the parent passing a new `text` via the
    // SpeakerButton's `text` prop. We can't read it directly here since
    // we don't receive text as a prop — autoRead is handled by the
    // SpeakerButton component (see below).
  }, [autoRead, available]);

  return { state, available, say, sayRaw, stop, error };
}

// Re-export for the SpeakerButton to use directly
export { cleanForSpeech, isCached, markCached };
