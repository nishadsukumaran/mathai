"use client";

/**
 * @module lib/voice/useSTT
 *
 * React hook for speech-to-text with math normalization and child-friendly
 * confirmation flow.
 *
 * Flow:
 *   1. Student taps mic → state becomes "listening"
 *   2. Student speaks → state becomes "processing" briefly
 *   3. Transcript arrives → normalized via math-normalize → state becomes "confirming"
 *   4. Student sees "I heard: 7 + 3 — Is that right?" → taps Yes or Try Again
 *   5. On confirm → onResult fires with the normalized text → state becomes "idle"
 *   6. On retry → state resets to "idle", student can tap mic again
 *
 * On any error, state becomes "error" with a child-friendly message.
 * The student can always fall back to typing — nothing is blocked.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { startListening, isSTTAvailable } from "./provider";
import { normalizeMath } from "./math-normalize";

export type STTState = "idle" | "listening" | "processing" | "confirming" | "error";

export interface UseSTTReturn {
  state:         STTState;
  available:     boolean;
  /** The raw transcript from the speech recognizer. */
  rawTranscript: string;
  /** The normalized math expression (after normalizeMath). */
  normalized:    string;
  /** Start listening. */
  listen:        () => void;
  /** Stop listening early. */
  stopListening: () => void;
  /** Confirm the normalized result — fires onResult. */
  confirm:       () => void;
  /** Retry — clears the transcript and returns to idle. */
  retry:         () => void;
  /** Cancel entirely — returns to idle. */
  cancel:        () => void;
  /** Last error message. */
  error:         string | null;
}

interface UseSTTOptions {
  /** Called when the student confirms the recognized text. */
  onResult: (text: string) => void;
  /** Whether to apply math normalization (default true). */
  normalize?: boolean;
  /** Max recording duration in seconds (default 12). */
  maxDuration?: number;
}

export function useSTT(options: UseSTTOptions): UseSTTReturn {
  const { onResult, normalize = true, maxDuration = 12 } = options;

  const [state, setState]       = useState<STTState>("idle");
  const [rawTranscript, setRaw] = useState("");
  const [normalized, setNorm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [available]             = useState(() => isSTTAvailable());
  const stopRef                 = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  const listen = useCallback(() => {
    if (!available) {
      setError("Voice input isn't available in this browser. You can type instead.");
      setState("error");
      return;
    }

    setError(null);
    setRaw("");
    setNorm("");
    setState("listening");

    stopRef.current = startListening({
      maxDuration,
      onStart: () => setState("listening"),
      onResult: (transcript) => {
        setState("processing");
        setRaw(transcript);

        // ── Guard: very short or empty speech ──
        const trimmed = transcript.trim();
        if (!trimmed || trimmed.length < 2) {
          setError("I heard something very short. Could you say that again, a little more clearly?");
          setState("error");
          return;
        }

        // ── Guard: gibberish detection (no letters or digits) ──
        if (!/[a-zA-Z0-9]/.test(trimmed)) {
          setError("I couldn't quite understand that. Try saying it slowly and clearly.");
          setState("error");
          return;
        }

        // Normalize (or pass through)
        const result = normalize ? normalizeMath(trimmed) : trimmed;

        // ── Guard: normalization produced nothing useful ──
        if (!result.trim()) {
          setError("I couldn't understand that as a math answer. Let's try again.");
          setState("error");
          return;
        }

        setNorm(result);

        // Short delay to show "processing" state, then move to confirming
        setTimeout(() => setState("confirming"), 200);
      },
      onError: (msg) => {
        if (msg) {
          setError(msg);
          setState("error");
        } else {
          setState("idle");
        }
      },
      onEnd: () => {
        // onEnd fires after onResult or onError — no action needed here
      },
    });
  }, [available, normalize, maxDuration]);

  const stopListening = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (state === "listening") {
      setState("idle");
    }
  }, [state]);

  const confirm = useCallback(() => {
    onResult(normalized || rawTranscript);
    setRaw("");
    setNorm("");
    setState("idle");
  }, [normalized, rawTranscript, onResult]);

  const retry = useCallback(() => {
    setRaw("");
    setNorm("");
    setError(null);
    setState("idle");
  }, []);

  const cancel = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setRaw("");
    setNorm("");
    setError(null);
    setState("idle");
  }, []);

  return {
    state,
    available,
    rawTranscript,
    normalized,
    listen,
    stopListening,
    confirm,
    retry,
    cancel,
    error,
  };
}
