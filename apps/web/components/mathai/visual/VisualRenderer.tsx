/**
 * @module components/mathai/visual/VisualRenderer
 *
 * Dispatcher component — reads `plan.diagramType` and renders the correct
 * visual sub-component. Used inside TutorPanel, AskPanel, and PracticeCard.
 *
 * Usage:
 *   <VisualRenderer plan={tutorResponse.visualPlan} animated />
 */

"use client";

import type { VisualPlan } from "@/types";
import { NumberLine }      from "./NumberLine";
import { FractionBar }     from "./FractionBar";
import { ArrayDiagram }    from "./ArrayDiagram";
import { BarModel }        from "./BarModel";
import { PlaceValueChart } from "./PlaceValueChart";

interface VisualRendererProps {
  plan:      VisualPlan;
  animated?: boolean;
  /** Optional extra className on the wrapper div */
  className?: string;
}

export function VisualRenderer({ plan, animated = true, className }: VisualRendererProps) {
  // Guard: plan may be undefined/null at runtime even though type says required.
  if (!plan) return null;

  const { diagramType, data } = plan;

  let diagram: React.ReactNode = null;

  switch (diagramType) {
    case "number_line":
      diagram = <NumberLine data={data} animated={animated} />;
      break;

    case "fraction_bar":
      // Guard: only create the element if the fractions array is non-empty;
      // otherwise diagram stays null and the wrapper div is skipped.
      if (data?.fractions && data.fractions.length > 0) {
        diagram = <FractionBar data={data} animated={animated} />;
      }
      break;

    case "array":
      diagram = <ArrayDiagram data={data} animated={animated} />;
      break;

    case "bar_model":
      diagram = <BarModel data={data} animated={animated} />;
      break;

    case "place_value_chart":
      diagram = <PlaceValueChart data={data} animated={animated} />;
      break;

    case "coordinate_grid":
    case "none":
    default:
      // Not yet implemented / no visual needed
      return null;
  }

  // If diagram is still null (e.g. fraction_bar with no fractions data),
  // skip the wrapper entirely so we don't render an empty styled box.
  if (!diagram) return null;

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-indigo-100 p-4 overflow-x-auto",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {diagram}
    </div>
  );
}
