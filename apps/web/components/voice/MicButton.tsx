"use client";

/**
 * @module components/voice/MicButton
 *
 * Microphone button with built-in confirmation flow for children.
 *
 * States:
 *   idle        → mic icon, tappable
 *   listening   → red pulse, "listening…" label, tap to stop
 *   processing  → spinner
 *   confirming  → shows "I heard: __" with Yes / Try Again buttons
 *   error       → friendly message with Retry / Type Instead
 *
 * The confirmation step is mandatory — we NEVER auto-submit what we heard.
 * The student always sees what the system understood and can correct it.
 */

import { useSTT, type STTState } from "@/lib/voice/useSTT";

interface Props {
  /** Called when the student confirms the recognized text. */
  onResult:   (text: string) => void;
  /** Whether to apply math normalization (default true). */
  normalize?: boolean;
  /** Additional CSS classes for positioning. */
  className?: string;
  /** Disable the button (e.g. when answer is revealed). */
  disabled?:  boolean;
  /** Placeholder text shown in the confirmation ("your answer" / "your question"). */
  context?:   string;
}

export function MicButton({
  onResult,
  normalize = true,
  className = "",
  disabled = false,
  context = "your answer",
}: Props) {
  const stt = useSTT({ onResult, normalize });

  if (!stt.available) return null;

  return (
    <div className={`relative ${className}`}>
      {/* ─── Idle / Listening / Processing: show the mic button ─── */}
      {(stt.state === "idle" || stt.state === "listening" || stt.state === "processing") && (
        <button
          type="button"
          onClick={() => stt.state === "listening" ? stt.stopListening() : stt.listen()}
          disabled={disabled}
          title={stt.state === "listening" ? "Stop listening" : "Speak " + context}
          aria-label={stt.state === "listening" ? "Stop listening" : "Speak " + context}
          className={`
            inline-flex items-center justify-center
            w-10 h-10 rounded-full transition-all
            ${stt.state === "listening"
              ? "bg-red-100 text-red-500 animate-pulse ring-2 ring-red-200"
              : stt.state === "processing"
                ? "bg-amber-50 text-amber-500"
                : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-500"
            }
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          {stt.state === "processing" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>
      )}

      {/* ─── Listening label ─── */}
      {stt.state === "listening" && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-red-400 whitespace-nowrap">
          Listening…
        </span>
      )}

      {/* ─── Confirmation popup ─── */}
      {stt.state === "confirming" && (
        <ConfirmationPopup
          normalized={stt.normalized}
          raw={stt.rawTranscript}
          onConfirm={stt.confirm}
          onRetry={stt.retry}
        />
      )}

      {/* ─── Error popup ─── */}
      {stt.state === "error" && stt.error && (
        <ErrorPopup
          message={stt.error}
          onRetry={stt.retry}
          onDismiss={stt.cancel}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConfirmationPopup({
  normalized,
  raw,
  onConfirm,
  onRetry,
}: {
  normalized: string;
  raw: string;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="absolute bottom-14 right-0 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-xs text-slate-400 mb-1">I heard:</p>
      <p className="text-base font-bold text-slate-800 mb-1">{normalized}</p>
      {raw !== normalized && (
        <p className="text-[10px] text-slate-300 mb-2 truncate" title={raw}>
          &quot;{raw}&quot;
        </p>
      )}
      <p className="text-xs text-slate-500 mb-3">Is that right?</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl hover:bg-emerald-600 transition"
        >
          Yes
        </button>
        <button
          onClick={onRetry}
          className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-xl hover:bg-slate-200 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function ErrorPopup({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="absolute bottom-14 right-0 z-50 w-64 bg-white rounded-2xl shadow-xl border border-amber-200 p-4 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-sm text-slate-700 mb-3">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex-1 bg-amber-500 text-white text-xs font-bold py-2 rounded-xl hover:bg-amber-600 transition"
        >
          Try again
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 bg-slate-100 text-slate-500 text-xs font-bold py-2 rounded-xl hover:bg-slate-200 transition"
        >
          Type instead
        </button>
      </div>
    </div>
  );
}
