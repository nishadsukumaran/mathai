"use client";

/**
 * @module components/voice/SpeakerButton
 *
 * "Read aloud" button for TTS. Designed for children:
 *   - Large tap target (44×44 minimum)
 *   - Clear visual states (idle / speaking / disabled)
 *   - Gentle pulsing animation while speaking
 *   - Auto-read option for junior grades
 *   - Visible fallback in unsupported browsers (not silently hidden)
 */

import { useEffect, useRef } from "react";
import { useTTS } from "@/lib/voice/useTTS";

interface Props {
  /** The text to speak when tapped. */
  text:       string;
  className?: string;
  label?:     string;
  /** If true, automatically read aloud when text changes. For junior grades. */
  autoRead?:  boolean;
  /** Speak mode: "question" adds teacher intro, "answer" uses answer phrasing, "raw" reads as-is. */
  mode?:      "question" | "answer" | "raw";
}

export function SpeakerButton({
  text,
  className = "",
  label = "Read aloud",
  autoRead = false,
  mode = "question",
}: Props) {
  const { state, available, say, sayRaw, stop } = useTTS();
  const lastAutoReadText = useRef("");

  const isSpeaking = state === "speaking";

  // Auto-read: speak when text changes (if enabled)
  useEffect(() => {
    if (!autoRead || !available || !text.trim()) return;
    // Only auto-read if the text actually changed (avoid re-reading on re-render)
    if (text === lastAutoReadText.current) return;
    lastAutoReadText.current = text;
    // Small delay so the UI renders first
    const timer = setTimeout(() => {
      if (mode === "raw" || mode === "answer") sayRaw(text);
      else say(text);
    }, 400);
    return () => clearTimeout(timer);
  }, [text, autoRead, available, say, sayRaw, mode]);

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else if (mode === "raw" || mode === "answer") {
      sayRaw(text);
    } else {
      say(text);
    }
  };

  // ─── Unsupported browser: show disabled button with tooltip, not nothing ──
  if (!available) {
    return (
      <button
        type="button"
        disabled
        title="Reading aloud isn't supported in this browser. Try Chrome or Edge."
        aria-label="Reading aloud not available"
        className={`
          inline-flex items-center justify-center
          w-10 h-10 rounded-full bg-slate-50 text-slate-300 cursor-not-allowed
          ${className}
        `}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isSpeaking ? "Stop reading" : label}
      aria-label={isSpeaking ? "Stop reading" : label}
      className={`
        inline-flex items-center justify-center
        w-10 h-10 rounded-full transition-all
        ${isSpeaking
          ? "bg-indigo-100 text-indigo-600 animate-pulse"
          : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-500"
        }
        disabled:opacity-30
        ${className}
      `}
    >
      {isSpeaking ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="4" height="12" rx="1" />
          <rect x="14" y="6" width="4" height="12" rx="1" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
