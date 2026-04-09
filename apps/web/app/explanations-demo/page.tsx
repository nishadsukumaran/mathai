"use client";

/**
 * @module app/explanations-demo/page
 *
 * Development demo page for the Visual Explanation Engine.
 *
 * Shows all currently supported explanation types with a scene selector.
 * Use this to verify the engine works end-to-end and to preview new
 * renderers during development.
 *
 * Not linked in the main nav — access via /explanations-demo.
 */

import { useState } from "react";
import {
  VisualExplanationPlayer,
  buildAdditionRegroupingScene,
  buildFractionComparisonScene,
  buildSimpleEquationScene,
} from "@/components/explanations";
import type { ExplanationScene } from "@/components/explanations";

interface DemoEntry {
  key:   string;
  label: string;
  build: () => ExplanationScene;
}

const DEMOS: DemoEntry[] = [
  { key: "add-27-15",  label: "27 + 15 (regrouping)",   build: () => buildAdditionRegroupingScene(27, 15) },
  { key: "add-48-36",  label: "48 + 36 (regrouping)",   build: () => buildAdditionRegroupingScene(48, 36) },
  { key: "frac-1-2-4", label: "1/2 vs 1/4",             build: () => buildFractionComparisonScene({ num1: 1, den1: 2, num2: 1, den2: 4 }) },
  { key: "frac-1-3-6", label: "1/3 vs 1/6",             build: () => buildFractionComparisonScene({ num1: 1, den1: 3, num2: 1, den2: 6 }) },
  { key: "eq-3-7",     label: "x + 3 = 7",              build: () => buildSimpleEquationScene({ b: 3, c: 7 }) },
  { key: "eq-5-12",    label: "x - 5 = 12",             build: () => buildSimpleEquationScene({ b: -5, c: 12 }) },
];

export default function ExplanationsDemoPage() {
  const [selected, setSelected] = useState(DEMOS[0]!.key);
  const entry = DEMOS.find((d) => d.key === selected) ?? DEMOS[0]!;
  const scene = entry.build();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Visual Explanation Engine — Demo</h1>
          <p className="text-sm text-slate-500 mt-1">
            GSAP + SVG + DrawSVG. Select an explanation to preview.
          </p>
        </div>

        {/* Selector */}
        <div className="flex flex-wrap gap-2">
          {DEMOS.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelected(d.key)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border-2 transition ${
                selected === d.key
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Player */}
        <VisualExplanationPlayer
          key={selected}            /* force remount when scene changes */
          scene={scene}
          initialVisual={true}
        />

        {/* Raw scene inspector */}
        <details className="bg-white rounded-2xl border border-slate-200 p-4">
          <summary className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
            Scene JSON ({scene.elements.length} elements, {scene.steps.length} steps)
          </summary>
          <pre className="mt-3 text-[10px] text-slate-600 overflow-auto max-h-80 bg-slate-50 p-3 rounded-lg">
            {JSON.stringify(scene, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
