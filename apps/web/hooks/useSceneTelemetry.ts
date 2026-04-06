/**
 * @module hooks/useSceneTelemetry
 *
 * Lightweight telemetry for scene engine events.
 * Currently logs to console in development and is ready
 * for a real analytics backend (Posthog, Vercel Analytics, etc.).
 *
 * Events tracked:
 *   scene:button_shown     — "Watch it" button rendered
 *   scene:button_clicked   — user clicked the button
 *   scene:plan_loaded      — plan resolved (template or AI)
 *   scene:validation_fail  — AI plan failed Zod validation
 *   scene:playback_done    — animation played to completion
 *   scene:replay           — user clicked replay
 */

import { useCallback, useRef } from "react";

type SceneEvent =
  | "button_shown"
  | "button_clicked"
  | "plan_loaded"
  | "validation_fail"
  | "playback_done"
  | "replay";

interface EventPayload {
  topic?:    string;
  source?:   "template" | "ai" | "fallback";
  issues?:   string[];
  question?: string;
  [key: string]: unknown;
}

function emit(event: SceneEvent, payload: EventPayload = {}) {
  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.log(`[scene:${event}]`, payload);
  }

  // Production: wire to your analytics provider here
  // e.g. posthog.capture(`scene_${event}`, payload);
  // e.g. window.va?.track(`scene_${event}`, payload);
}

export function useSceneTelemetry(question: string, topic: string) {
  const shownRef = useRef(false);

  const buttonShown = useCallback(() => {
    if (shownRef.current) return; // only fire once per mount
    shownRef.current = true;
    emit("button_shown", { topic, question });
  }, [topic, question]);

  const buttonClicked = useCallback(() => {
    emit("button_clicked", { topic, question });
  }, [topic, question]);

  const planLoaded = useCallback((source: "template" | "ai" | "fallback") => {
    emit("plan_loaded", { topic, source, question });
  }, [topic, question]);

  const validationFailed = useCallback((issues: string[]) => {
    emit("validation_fail", { topic, issues, question });
  }, [topic, question]);

  const playbackDone = useCallback(() => {
    emit("playback_done", { topic, question });
  }, [topic, question]);

  const replay = useCallback(() => {
    emit("replay", { topic, question });
  }, [topic, question]);

  return { buttonShown, buttonClicked, planLoaded, validationFailed, playbackDone, replay };
}
