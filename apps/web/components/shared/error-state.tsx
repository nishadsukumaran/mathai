/**
 * @module components/shared/error-state
 *
 * Friendly error display for data-fetch failures.
 * Never shows raw error messages to children.
 * Always provides a retry CTA.
 */

"use client";

import { cn } from "@/lib/utils";
import { API_ERROR_CODES } from "@/types";

interface ErrorStateProps {
  /** Raw error code from ApiClientError.code */
  code?: string;
  /** Override the default message for this specific context */
  message?: string;
  /** Called when the user clicks Retry */
  onRetry?: () => void;
  className?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  [API_ERROR_CODES.NETWORK]:         "Can't connect to MathAI. Check your internet.",
  [API_ERROR_CODES.UNAUTHORIZED]:    "You need to log in to see this.",
  [API_ERROR_CODES.SESSION_EXPIRED]: "Your session timed out. Start a new one!",
  [API_ERROR_CODES.NOT_FOUND]:       "We couldn't find what you were looking for.",
  [API_ERROR_CODES.UNKNOWN]:         "Something went wrong on our end. We're on it!",
};

export function ErrorState({ code, message, onRetry, className }: ErrorStateProps) {
  const displayMessage =
    message ??
    (code ? (ERROR_MESSAGES[code] ?? ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN]) : "Something went wrong. Please try again.");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl",
        "bg-rose-50 border border-rose-100 p-8 text-center",
        className
      )}
      role="alert"
    >
      {/* Simple SVG warning icon */}
      <div className="text-4xl" aria-hidden="true">😕</div>

      <p className="text-base font-semibold text-rose-700">{displayMessage}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "mt-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white",
            "hover:bg-rose-600 active:scale-95 transition-all duration-150 focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
          )}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/** Inline error — just text + optional retry, no card wrapper */
export function InlineError({ message, onRetry, className }: Omit<ErrorStateProps, "code">) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-rose-600", className)}>
      <span aria-hidden="true">⚠️</span>
      <span>{message ?? "Something went wrong."}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline font-medium hover:text-rose-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
