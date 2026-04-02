"use client";

/**
 * @module hooks/use-progressive-prompt
 *
 * Lightweight placeholder for progressive onboarding prompts.
 *
 * Future trigger conditions:
 *   - After first practice session → prompt for learning goal
 *   - After 3 sessions → prompt for preference refinement
 *   - After 7 days → prompt for theme selection
 *
 * For now: exposes a simple API that components can call.
 * The actual prompts and trigger logic will be implemented
 * when the progressive onboarding feature is fully built.
 *
 * USAGE:
 *   const { shouldShow, dismiss } = useProgressivePrompt("goal");
 *   if (shouldShow) { <PromptModal /> }
 */

import { useState, useCallback } from "react";

export type PromptType = "goal" | "preference" | "theme";

/**
 * Placeholder hook for progressive prompts.
 * Always returns shouldShow=false until trigger logic is implemented.
 */
export function useProgressivePrompt(type: PromptType) {
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
    // Future: persist dismissal to localStorage or API
    // localStorage.setItem(`prompt_dismissed_${type}`, "true");
  }, []);

  // Future: check sessionCount, days active, etc.
  // For now, never show — placeholder only
  const shouldShow = false && !dismissed;

  return { shouldShow, dismiss, type };
}
