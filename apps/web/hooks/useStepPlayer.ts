"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { WalkthroughStep } from "@mathai/shared-types";

export interface StepPlayerState {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isComplete: boolean;
  step: WalkthroughStep | null;
}

export interface StepPlayerControls {
  play: () => void;
  pause: () => void;
  next: () => void;
  back: () => void;
  replay: () => void;
  goToStep: (n: number) => void;
}

interface UseStepPlayerOptions {
  steps: WalkthroughStep[];
  autoPlay?: boolean;
  stepDurationMs?: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useStepPlayer({
  steps,
  autoPlay = true,
  stepDurationMs = 2000,
}: UseStepPlayerOptions): [StepPlayerState, StepPlayerControls] {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() =>
    autoPlay && !prefersReducedMotion()
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = steps.length;
  const isComplete = currentStep >= totalSteps - 1;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isPlaying && !isComplete) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = Math.min(prev + 1, totalSteps - 1);
          if (next >= totalSteps - 1) {
            queueMicrotask(() => setIsPlaying(false));
          }
          return next;
        });
      }, stepDurationMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isComplete, stepDurationMs, totalSteps]);

  const play = useCallback(() => {
    if (isComplete) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  }, [isComplete]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const next = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const back = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const replay = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  const goToStep = useCallback(
    (n: number) => {
      setIsPlaying(false);
      setCurrentStep(Math.max(0, Math.min(n, totalSteps - 1)));
    },
    [totalSteps]
  );

  const state: StepPlayerState = {
    currentStep,
    totalSteps,
    isPlaying,
    isComplete,
    step: steps[currentStep] ?? null,
  };

  const controls: StepPlayerControls = { play, pause, next, back, replay, goToStep };

  return [state, controls];
}
