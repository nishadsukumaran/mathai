"use client";

/**
 * @module components/explanations/player/VisualExplanationPlayer
 *
 * Interactive player for ExplanationScenes.
 *
 * Controls:
 *   - Play / Pause
 *   - Restart
 *   - Previous / Next step
 *   - Step counter
 *   - Speed (0.5x, 1x, 1.5x)
 *   - "Show visual" toggle (falls back to plain text)
 *
 * Architecture:
 *   1. On mount, build the master timeline via buildTimeline()
 *   2. Each step has its own sub-timeline for discrete stepping
 *   3. Play button plays the current step, then auto-advances
 *   4. Prev/Next jump between steps (resets + replays each step
 *      from its initial DOM state)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { SceneCanvas } from "../engine/SceneCanvas";
import { buildTimeline, initializeElements, buildStepTimeline } from "../engine/timeline-builder";
import { ensureGsapPlugins, gsap } from "../engine/gsap-setup";
import type { ExplanationScene } from "../engine/scene-types";

interface Props {
  scene:         ExplanationScene;
  /** Optional plain-text fallback shown when visual mode is toggled off. */
  textFallback?: string;
  /** Default visual mode. Parent can persist via localStorage. */
  initialVisual?: boolean;
  className?:    string;
}

type PlayState = "idle" | "playing" | "paused" | "done";

export function VisualExplanationPlayer({
  scene, textFallback, initialVisual = true, className = "",
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const currentStepTl = useRef<gsap.core.Timeline | null>(null);

  const [visualMode, setVisualMode] = useState(initialVisual);
  const [stepIndex, setStepIndex]   = useState(0);
  const [playState, setPlayState]   = useState<PlayState>("idle");
  const [speed, setSpeed]           = useState<0.5 | 1 | 1.5>(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const totalSteps = scene.steps.length;
  const currentStep = scene.steps[stepIndex];

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Cleanup: kill any running timeline on unmount or scene change
  useEffect(() => {
    return () => {
      currentStepTl.current?.kill();
      currentStepTl.current = null;
    };
  }, [scene.id]);

  // Initialize elements when scene changes (or on first mount)
  useEffect(() => {
    if (!svgRef.current) return;
    ensureGsapPlugins();
    initializeElements(svgRef.current, scene);
    setStepIndex(0);
    setPlayState("idle");
  }, [scene]);

  // ─── Play a specific step ───────────────────────────────────────────────
  const playStep = useCallback((index: number) => {
    if (!svgRef.current || index < 0 || index >= totalSteps) return;

    // Kill any previous step timeline
    currentStepTl.current?.kill();

    const step = scene.steps[index];
    if (!step) return;

    // If reduced motion, jump all elements straight to their final visible state
    if (reducedMotion) {
      const all = svgRef.current.querySelectorAll<SVGElement>("[id]");
      gsap.set(Array.from(all), { opacity: 1, x: 0, y: 0, scale: 1 });
      setStepIndex(index);
      setPlayState("done");
      return;
    }

    const tl = buildStepTimeline(svgRef.current, step);
    tl.timeScale(speed);
    tl.eventCallback("onComplete", () => {
      // Auto-advance if not at end
      if (index < totalSteps - 1 && playState === "playing") {
        setTimeout(() => playStep(index + 1), 400);
      } else {
        setPlayState("done");
      }
    });

    currentStepTl.current = tl;
    setStepIndex(index);
    tl.play(0);
  }, [scene, totalSteps, speed, playState, reducedMotion]);

  // ─── Control handlers ───────────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    if (!svgRef.current) return;

    // If we're at the end, restart from step 0
    if (playState === "done" || stepIndex >= totalSteps - 1) {
      initializeElements(svgRef.current, scene);
      setPlayState("playing");
      playStep(0);
      return;
    }

    // Resume / start current step
    setPlayState("playing");
    if (currentStepTl.current && currentStepTl.current.progress() > 0) {
      currentStepTl.current.play();
    } else {
      playStep(stepIndex);
    }
  }, [playState, stepIndex, totalSteps, playStep, scene]);

  const handlePause = useCallback(() => {
    currentStepTl.current?.pause();
    setPlayState("paused");
  }, []);

  const handleRestart = useCallback(() => {
    if (!svgRef.current) return;
    currentStepTl.current?.kill();
    initializeElements(svgRef.current, scene);
    setStepIndex(0);
    setPlayState("idle");
  }, [scene]);

  const handleNext = useCallback(() => {
    if (stepIndex >= totalSteps - 1) return;
    // Jump to next step: re-initialize elements up to and including this step,
    // then play the next step from a clean state.
    // Simpler approach: fast-forward current step, then play next.
    currentStepTl.current?.progress(1);
    playStep(stepIndex + 1);
    setPlayState("paused");
  }, [stepIndex, totalSteps, playStep]);

  const handlePrev = useCallback(() => {
    if (stepIndex === 0 || !svgRef.current) return;
    currentStepTl.current?.kill();
    // Re-initialize and replay all steps up to (but not including) the previous step
    // so we have the correct DOM state for the target step.
    initializeElements(svgRef.current, scene);
    const targetIndex = stepIndex - 1;
    // Fast-forward all prior steps instantly
    for (let i = 0; i < targetIndex; i++) {
      const step = scene.steps[i];
      if (!step) continue;
      const tl = buildStepTimeline(svgRef.current, step);
      tl.progress(1).kill();
    }
    playStep(targetIndex);
    setPlayState("paused");
  }, [stepIndex, scene, playStep]);

  const handleSpeedChange = useCallback(() => {
    const next = speed === 0.5 ? 1 : speed === 1 ? 1.5 : 0.5;
    setSpeed(next);
    currentStepTl.current?.timeScale(next);
  }, [speed]);

  // ─── Render ─────────────────────────────────────────────────────────────

  // Fallback: plain text mode
  if (!visualMode) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {scene.topic}
          </span>
          <button
            onClick={() => setVisualMode(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Show Visual ✨
          </button>
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-3">{scene.title}</h3>
        <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
          {textFallback ? (
            <p>{textFallback}</p>
          ) : (
            scene.steps.map((step, i) => (
              step.narration && (
                <p key={step.id}>
                  <span className="font-bold text-slate-400">{i + 1}.</span> {step.narration}
                </p>
              )
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {scene.topic}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{scene.title}</span>
          <button
            onClick={() => setVisualMode(false)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            title="Show as text"
          >
            Text
          </button>
        </div>
      </div>

      {/* Canvas */}
      <SceneCanvas ref={svgRef} scene={scene} />

      {/* Narration */}
      {currentStep?.narration && (
        <div className="px-5 py-3 border-t border-slate-100 min-h-[56px] bg-slate-50/50">
          <p className="text-sm text-slate-700 leading-relaxed">
            {currentStep.narration}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
        {/* Prev */}
        <button
          onClick={handlePrev}
          disabled={stepIndex === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Previous step"
          aria-label="Previous step"
        >
          <ChevronLeft />
        </button>

        {/* Play / Pause / Restart */}
        {playState === "playing" ? (
          <button
            onClick={handlePause}
            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-sm"
            title="Pause"
            aria-label="Pause"
          >
            <PauseIcon />
          </button>
        ) : playState === "done" ? (
          <button
            onClick={handleRestart}
            className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shadow-sm"
            title="Replay"
            aria-label="Replay"
          >
            <RestartIcon />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-sm"
            title="Play"
            aria-label="Play"
          >
            <PlayIcon />
          </button>
        )}

        {/* Next */}
        <button
          onClick={handleNext}
          disabled={stepIndex >= totalSteps - 1}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Next step"
          aria-label="Next step"
        >
          <ChevronRight />
        </button>

        {/* Step counter + progress dots */}
        <div className="flex-1 flex items-center justify-center gap-1.5">
          {scene.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!svgRef.current) return;
                currentStepTl.current?.kill();
                initializeElements(svgRef.current, scene);
                // Fast-forward all prior steps
                for (let j = 0; j < i; j++) {
                  const step = scene.steps[j];
                  if (!step) continue;
                  const tl = buildStepTimeline(svgRef.current, step);
                  tl.progress(1).kill();
                }
                playStep(i);
                setPlayState("paused");
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === stepIndex
                  ? "bg-indigo-600 w-6"
                  : i < stepIndex
                  ? "bg-indigo-300"
                  : "bg-slate-200"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-xs font-semibold text-slate-500 min-w-[3ch] text-center">
          {stepIndex + 1}/{totalSteps}
        </span>

        {/* Speed */}
        <button
          onClick={handleSpeedChange}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 min-w-[3.5ch] transition"
          title="Playback speed"
        >
          {speed}x
        </button>
      </div>

      {reducedMotion && (
        <div className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100 bg-amber-50/50">
          Reduced motion is enabled. Animations are shown as static states.
        </div>
      )}
    </div>
  );
}

// ─── Icon components ────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M3 1.5 L12 7 L3 12.5 Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="3" y="2" width="3" height="10" rx="0.5" />
      <rect x="8" y="2" width="3" height="10" rx="0.5" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 7 a 5.5 5.5 0 1 0 1.7 -3.9" />
      <polyline points="1.5 1.5 1.5 5 5 5" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10 12 6 8 10 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 4 10 8 6 12" />
    </svg>
  );
}
