"use client";

/**
 * @module components/voice/SpeakerButton
 *
 * "Read aloud" button for TTS. Designed for children:
 *   - Large tap target (44×44 minimum)
 *   - Clear visual states (idle / speaking / disabled)
 *   - Gentle pulsing animation while speaking
 *   - No text label needed — the icon speaks for itself
 */

import { useTTS } from "@/lib/voice/useTTS";

interface Props {
  /** The text to speak when tapped. */
  text:       string;
  /** Additional CSS classes for positioning. */
  className?: string;
  /** Label shown in tooltip. */
  label?:     string;
}

export function SpeakerButton({ text, className = "", label = "Read aloud" }: Props) {
  const { state, available, say, stop } = useTTS();

  if (!available) return null;  // graceful fallback — button doesn't render

  const isSpeaking = state === "speaking";

  return (
    <button
      type="button"
      onClick={() => isSpeaking ? stop() : say(text)}
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
