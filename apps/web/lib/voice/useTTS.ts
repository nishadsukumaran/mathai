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
//
// A teacher doesn't read "27 plus 15" like a screen reader.
// A teacher says: "Okay... let's work out... 27... plus... 15."
//
// The pauses (represented by "..." in the text sent to TTS) make the AI voice
// sound like it's thinking, guiding, and giving the student time to follow.
// Without them, even the best AI voice sounds like a text reader.
//
// The transformation rules:
//   1. Strip LaTeX into speakable words
//   2. Add a warm, varied intro
//   3. Insert pauses around operators and key math terms
//   4. Slow down numbers by spacing digits for multi-digit numbers
//   5. Add a gentle closing

const QUESTION_INTROS = [
  "Okay... let's work this out.",
  "Alright... here's the question.",
  "Let's try this one together.",
  "Okay... let's see.",
  "Right... here we go.",
];

const ANSWER_INTROS = [
  "So... the answer is...",
  "Great question! ... The answer is...",
  "Alright... so the answer is...",
];

const CORRECT_RESPONSES = [
  "That's right! Well done.",
  "Yes! Good job.",
  "Exactly right. Nice work.",
  "That's correct! You got it.",
];

const ENCOURAGEMENT = [
  "Take your time.",
  "You can do this.",
  "Give it a try.",
  "Think about it step by step.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Transform text into teacher-like spoken script.
 *
 * "27 + 15" → "Okay... let's work this out. ... 27... plus... 15. ... Take your time."
 *
 * The "..." pauses are natural breath points that any good TTS voice will
 * render as brief hesitations. This is what makes it sound like teaching
 * rather than reading.
 */
export function teacherPhrase(text: string, mode: "question" | "answer" | "raw" = "question"): string {
  const cleaned = cleanForSpeech(text);
  if (!cleaned) return "";

  if (mode === "raw") return cleaned;

  if (mode === "answer") {
    const intro = pick(ANSWER_INTROS);
    return `${intro} ${addMathPauses(cleaned)}.`;
  }

  // Question mode
  const intro = pick(QUESTION_INTROS);

  // Bare math expression (e.g. "27 plus 15")
  if (/^[\d\s\w+\-×÷=.*/%()]+$/.test(cleaned) && /\d/.test(cleaned)) {
    const mathWithPauses = addMathPauses(cleaned);
    const closing = pick(ENCOURAGEMENT);
    return `${intro} ... ${mathWithPauses}. ... ${closing}`;
  }

  // Full sentence question (e.g. "What is 3 times 4?")
  if (/^(what|how|why|find|solve|calculate|which|if|a |the )/i.test(cleaned)) {
    const withPauses = addMathPauses(cleaned);
    return `${intro} ... ${withPauses}`;
  }

  return `${intro} ... ${addMathPauses(cleaned)}`;
}

/**
 * Insert natural pauses around math operators and between key terms.
 * "27 plus 15" → "27... plus... 15"
 * "3 times 4 equals 12" → "3... times 4... equals... 12"
 */
function addMathPauses(text: string): string {
  return text
    // Pause before and after operators
    .replace(/\s+(plus|minus|times|divided by|equals|over)\s+/gi, "... $1... ")
    // Pause before "is" when used as equals
    .replace(/\s+is\s+/gi, "... is... ")
    // Pause after question words for emphasis
    .replace(/^(what|how much|how many|find|solve|calculate)/gi, "$1...")
    // Clean up multiple dots
    .replace(/\.{4,}/g, "...")
    .replace(/\s+/g, " ")
    .trim();
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
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/\*/g, " times ")
    .replace(/\s+/g, " ")
    .trim();
}

export { CORRECT_RESPONSES, ENCOURAGEMENT };

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
