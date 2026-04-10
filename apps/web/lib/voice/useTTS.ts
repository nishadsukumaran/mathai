"use client";

/**
 * @module lib/voice/useTTS
 *
 * React hook for text-to-speech. Wraps the voice provider with React
 * lifecycle management (auto-cleanup on unmount, state tracking).
 *
 * Voice persona: warm, clear, patient primary-school math teacher.
 * Rate is slightly slower than default (0.88) for child comprehension.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { speak, stopSpeaking, isTTSAvailable } from "./provider";

export type TTSState = "idle" | "speaking" | "error";

export interface UseTTSReturn {
  /** Current state. */
  state:     TTSState;
  /** Whether TTS is supported in this browser. */
  available: boolean;
  /** Speak the given text. Cancels any current speech. */
  say:       (text: string) => void;
  /** Stop speaking immediately. */
  stop:      () => void;
  /** Last error message (null if no error). */
  error:     string | null;
}

export function useTTS(): UseTTSReturn {
  const [state, setState]   = useState<TTSState>("idle");
  const [error, setError]   = useState<string | null>(null);
  const [available]         = useState(() => isTTSAvailable());
  const cancelRef           = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current?.();
      stopSpeaking();
    };
  }, []);

  const say = useCallback((text: string) => {
    if (!available) {
      setError("Speech is not available in this browser.");
      setState("error");
      return;
    }

    // Strip LaTeX markers for clean speech
    const cleanText = text
      .replace(/\\\(|\\\)/g, "")     // inline LaTeX delimiters
      .replace(/\\\[|\\\]/g, "")     // display LaTeX delimiters
      .replace(/\$\$?/g, "")         // dollar-sign delimiters
      .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, "$1 over $2")  // \frac{1}{2} → "1 over 2"
      .replace(/\\times/g, " times ")
      .replace(/\\div/g, " divided by ")
      .replace(/\\pm/g, " plus or minus ")
      .replace(/[\\{}]/g, "")        // remaining LaTeX cruft
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    setError(null);
    setState("speaking");

    cancelRef.current = speak({
      text: cleanText,
      onEnd:   () => setState("idle"),
      onError: (err) => {
        if (err) {
          setError(err);
          setState("error");
        }
      },
    });
  }, [available]);

  const stop = useCallback(() => {
    cancelRef.current?.();
    stopSpeaking();
    setState("idle");
  }, []);

  return { state, available, say, stop, error };
}
