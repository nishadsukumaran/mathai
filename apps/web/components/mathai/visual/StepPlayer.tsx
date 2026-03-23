"use client";

import type { AnimatedWalkthroughData } from "@mathai/shared-types";
import { useStepPlayer } from "@/hooks/useStepPlayer";
import { StepControls } from "./StepControls";
import { StepLabel } from "./StepLabel";
import { NumberLine } from "./NumberLine";
import { FractionBar } from "./FractionBar";
import { ArrayDiagram } from "./ArrayDiagram";
import { BarModel } from "./BarModel";
import { PlaceValueChart } from "./PlaceValueChart";

interface StepPlayerProps {
  data: AnimatedWalkthroughData;
  className?: string;
}

const DIAGRAM_COMPONENTS: Record<string, React.ComponentType<{ data: any; animated?: boolean }>> = {
  number_line: NumberLine,
  fraction_bar: FractionBar,
  array: ArrayDiagram,
  bar_model: BarModel,
  place_value_chart: PlaceValueChart,
};

export function StepPlayer({ data, className }: StepPlayerProps) {
  const { title, steps, baseDiagram, baseData, autoPlay, stepDurationMs } = data;

  const [state, controls] = useStepPlayer({
    steps,
    autoPlay: autoPlay ?? true,
    stepDurationMs: stepDurationMs ?? 2000,
  });

  const DiagramComponent = DIAGRAM_COMPONENTS[baseDiagram];
  if (!DiagramComponent || steps.length === 0) return null;

  // Shallow merge: step's visibleState overrides baseData keys
  const mergedData = state.step
    ? { ...baseData, ...state.step.visibleState }
    : baseData;

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-indigo-100 overflow-hidden",
        className ?? "",
      ].join(" ").trim()}
    >
      {title && (
        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold">
          {title}
        </div>
      )}

      <StepLabel
        currentStep={state.currentStep}
        totalSteps={state.totalSteps}
        label={state.step?.label ?? ""}
      />

      <div className="p-4 transition-opacity duration-300">
        <DiagramComponent data={mergedData} animated={false} />
      </div>

      <StepControls state={state} controls={controls} />
    </div>
  );
}
