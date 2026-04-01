"use client";

/**
 * @module components/mathai/visual/EquationSteps
 *
 * Renders equation solving steps with progressive reveal animation.
 * Each step shows the operation performed and the resulting expression.
 * Uses Framer Motion for smooth step-by-step reveal.
 */

import { motion } from "framer-motion";
import type { EquationStepsData } from "@mathai/shared-types";

interface EquationStepsProps {
  data:      EquationStepsData;
  animated?: boolean;
}

const STEP_COLORS = [
  "border-indigo-300 bg-indigo-50",
  "border-emerald-300 bg-emerald-50",
  "border-amber-300 bg-amber-50",
  "border-pink-300 bg-pink-50",
  "border-violet-300 bg-violet-50",
];

const DOT_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-violet-500",
];

export function EquationSteps({ data, animated = true }: EquationStepsProps) {
  if (!data.steps || data.steps.length === 0) return null;

  return (
    <div className="space-y-2">
      {data.title && (
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          {data.title}
        </p>
      )}

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200 rounded-full" />

        {data.steps.map((step, i) => {
          const colorClass = STEP_COLORS[i % STEP_COLORS.length]!;
          const dotClass   = DOT_COLORS[i % DOT_COLORS.length]!;
          const isLast     = i === data.steps.length - 1;

          const content = (
            <div key={i} className="relative flex items-start gap-3 pl-1">
              {/* Step dot */}
              <div className={`relative z-10 mt-1.5 w-7 h-7 rounded-full ${dotClass} flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0`}>
                {i + 1}
              </div>

              {/* Step card */}
              <div className={`flex-1 rounded-2xl border ${colorClass} px-4 py-3 ${isLast ? "shadow-md" : "shadow-sm"}`}>
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  {step.label}
                </p>
                <p className="text-sm font-mono text-gray-800 font-bold leading-relaxed">
                  {step.expression}
                </p>
                {step.result && (
                  <p className="text-sm font-mono text-indigo-700 font-black mt-1">
                    → {step.result}
                  </p>
                )}
              </div>
            </div>
          );

          if (!animated) return <div key={i}>{content}</div>;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay:    i * 0.15,
                duration: 0.3,
                ease:     "easeOut",
              }}
            >
              {content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
