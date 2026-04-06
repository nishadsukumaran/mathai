"use client";

/**
 * @module components/scene-engine/SceneExplanation
 *
 * Self-contained widget for the Ask MathAI response card.
 * Handles the full lifecycle:
 *   1. Show "Watch it" button (only if scene-eligible)
 *   2. On click: try template → try AI → validate → fallback
 *   3. Render ScenePlayer
 *   4. Fire telemetry events
 *
 * Does NOT auto-play. User must click.
 */

import { useState, useEffect, useCallback }  from "react";
import { motion, AnimatePresence }            from "framer-motion";
import { ScenePlayer }                        from "./ScenePlayer";
import { dispatchScene, isSceneEligible }     from "@/lib/scene-engine/dispatcher";
import { validateScenePlan }                  from "@/lib/scene-engine/validator";
import { useSceneTelemetry }                  from "@/hooks/useSceneTelemetry";
import { clientPost }                         from "@/lib/clientApi";
import type { ScenePlan }                     from "@/lib/scene-engine/types";
import type { MathData }                      from "@/types";

interface SceneExplanationProps {
  question: string;
  mathData: MathData | undefined | null;
  grade?:   string;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

export function SceneExplanation({ question, mathData, grade }: SceneExplanationProps) {
  const eligible = isSceneEligible(mathData);
  const topic = mathData?.type ?? "unknown";
  const telemetry = useSceneTelemetry(question, topic);

  const [state, setState]  = useState<LoadState>("idle");
  const [plan, setPlan]    = useState<ScenePlan | null>(null);
  const [source, setSource] = useState<"template" | "ai" | "fallback">("template");
  const [error, setError]  = useState<string | null>(null);

  // Fire "button shown" telemetry once when eligible
  useEffect(() => {
    if (eligible) telemetry.buttonShown();
  }, [eligible, telemetry]);

  const handleClick = useCallback(async () => {
    telemetry.buttonClicked();
    setState("loading");
    setError(null);

    // ── Step 1: Try template (synchronous, instant) ────────────────────────
    const dispatch = dispatchScene(mathData, question);

    if (dispatch.plan) {
      const validation = validateScenePlan(dispatch.plan, question);
      if (validation.valid) {
        setPlan(validation.plan);
        setSource("template");
        setState("loaded");
        telemetry.planLoaded("template");
        return;
      }
      // Template plan somehow invalid (shouldn't happen but be safe)
      telemetry.validationFailed(validation.issues);
    }

    // ── Step 2: Try AI generation (if eligible) ────────────────────────────
    if (dispatch.eligible || dispatch.source === "none") {
      try {
        const aiPlan = await clientPost<ScenePlan>("/tutor/generate-scene", {
          question,
          mathData,
          grade,
        });

        if (aiPlan) {
          const validation = validateScenePlan(aiPlan, question);
          if (validation.valid) {
            setPlan(validation.plan);
            setSource("ai");
            setState("loaded");
            telemetry.planLoaded("ai");
            return;
          }
          // AI plan failed validation — use the text-only fallback from validator
          telemetry.validationFailed(validation.issues);
          setPlan(validation.plan); // this is the safe fallback
          setSource("fallback");
          setState("loaded");
          telemetry.planLoaded("fallback");
          return;
        }
      } catch {
        // AI generation failed — fall through to fallback
      }
    }

    // ── Step 3: Final fallback — text-only scene ───────────────────────────
    const { plan: fallbackPlan } = validateScenePlan(null, question);
    setPlan(fallbackPlan);
    setSource("fallback");
    setState("loaded");
    telemetry.planLoaded("fallback");
  }, [mathData, question, grade, telemetry]);

  // Don't render anything if not eligible
  if (!eligible) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {/* ── Idle: Show button ──────────────────────────────────────── */}
        {state === "idle" && (
          <motion.button
            key="btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleClick}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-violet-300 text-violet-600 font-semibold text-sm hover:bg-violet-50 hover:border-violet-400 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <span className="text-lg">▶</span>
            <span>Watch Animated Explanation</span>
          </motion.button>
        )}

        {/* ── Loading ────────────────────────────────────────────────── */}
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-4 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center gap-3"
          >
            <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-violet-700 animate-spin" />
            <span className="text-violet-600 text-sm font-medium">Building animation...</span>
          </motion.div>
        )}

        {/* ── Loaded: Show ScenePlayer ───────────────────────────────── */}
        {state === "loaded" && plan && (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScenePlayer plan={plan} />
            {/* Source badge + replay */}
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-gray-400 font-medium">
                {source === "template" ? "Template animation" : source === "ai" ? "AI-generated" : "Basic view"}
              </span>
              <button
                onClick={() => {
                  telemetry.replay();
                  setState("idle");
                  setPlan(null);
                }}
                className="text-[10px] text-violet-500 font-semibold hover:text-violet-700 transition"
              >
                Watch again
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-3 rounded-2xl bg-red-50 border border-red-200 text-center"
          >
            <p className="text-red-600 text-sm">{error ?? "Couldn't load animation"}</p>
            <button onClick={handleClick} className="text-red-500 text-xs underline mt-1">Try again</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
