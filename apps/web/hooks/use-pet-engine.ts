"use client";

/**
 * @module hooks/use-pet-engine
 *
 * React hook that wraps the pet engine for component consumption.
 *
 * Provides:
 *   - current reaction state (mood, animation, message)
 *   - trigger(event) to fire a pet event
 *   - auto-return to idle after reaction duration
 *
 * The hook manages the lifecycle: event → reaction → timeout → idle.
 * Components just read the current state and render.
 *
 * USAGE:
 *   const { reaction, trigger } = usePetEngine(pet?.personality);
 *   // On correct answer:
 *   trigger("correct_answer");
 *   // In PetCompanion:
 *   <PetCompanion reaction={reaction} />
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getReaction,
  type PetEvent,
  type PetReaction,
} from "@/lib/petEngine";

const IDLE_REACTION: PetReaction = {
  mood:      "idle",
  animation: "bob",
  duration:  0,
};

export function usePetEngine(personality?: string) {
  const [reaction, setReaction] = useState<PetReaction>(IDLE_REACTION);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * Trigger a pet event. The reaction will auto-revert to idle
   * after the reaction's duration.
   */
  const trigger = useCallback((event: PetEvent) => {
    clearTimeout(timerRef.current);

    if (event === "idle") {
      setReaction(IDLE_REACTION);
      return;
    }

    const r = getReaction(event, personality);
    setReaction(r);

    // Auto-return to idle after duration
    if (r.duration > 0) {
      timerRef.current = setTimeout(() => {
        setReaction(IDLE_REACTION);
      }, r.duration);
    }
  }, [personality]);

  return { reaction, trigger };
}
