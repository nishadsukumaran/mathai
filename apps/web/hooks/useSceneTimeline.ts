/**
 * @module hooks/useSceneTimeline
 *
 * Playback controller for scene plans.
 * Auto-advances through steps based on duration.
 * Supports play/pause, manual prev/next, and restart.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ScenePlan } from "@/lib/scene-engine/types";

export interface TimelineState {
  stepIndex:    number;
  isPlaying:    boolean;
  isComplete:   boolean;
  elapsed:      number;   // seconds elapsed in current step
  totalSteps:   number;
  play:         () => void;
  pause:        () => void;
  next:         () => void;
  prev:         () => void;
  restart:      () => void;
  goTo:         (index: number) => void;
}

export function useSceneTimeline(plan: ScenePlan): TimelineState {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const totalSteps = plan.steps.length;
  const safeIdx = Math.min(stepIndex, totalSteps - 1);
  const currentStepDuration = plan.steps[safeIdx]?.duration ?? 3;
  const isComplete = stepIndex >= totalSteps;

  // Tick every 100ms while playing
  useEffect(() => {
    if (!isPlaying || isComplete) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.1;
        if (next >= currentStepDuration) {
          // Auto-advance to next step
          setStepIndex((si) => {
            const nextIdx = si + 1;
            if (nextIdx >= totalSteps) {
              setIsPlaying(false);
              return totalSteps; // marks complete
            }
            return nextIdx;
          });
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, isComplete, stepIndex, currentStepDuration, totalSteps]);

  const play    = useCallback(() => { if (!isComplete) setIsPlaying(true); }, [isComplete]);
  const pause   = useCallback(() => setIsPlaying(false), []);
  const restart = useCallback(() => { setStepIndex(0); setElapsed(0); setIsPlaying(true); }, []);

  const next = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
      setElapsed(0);
    } else {
      setStepIndex(totalSteps);
      setIsPlaying(false);
    }
  }, [stepIndex, totalSteps]);

  const prev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setElapsed(0);
    }
  }, [stepIndex]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setStepIndex(index);
      setElapsed(0);
    }
  }, [totalSteps]);

  return {
    stepIndex: Math.min(stepIndex, totalSteps - 1),
    isPlaying,
    isComplete,
    elapsed,
    totalSteps,
    play, pause, next, prev, restart, goTo,
  };
}
