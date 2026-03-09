/**
 * @module ai/tutor/visual_plan_builder
 *
 * Determines the optimal visual representation for a math concept
 * and builds the data payload for the frontend to render.
 *
 * DIAGRAM TYPES:
 *   number_line  — great for addition, subtraction, number sense
 *   area_model   — multiplication and fractions
 *   bar_model    — comparison, ratio, word problems
 *   fraction_bar — fraction equivalence and operations
 *   graph        — data and probability
 *   table        — patterns, functions, multiplication tables
 *
 * The frontend receives this payload and renders the diagram using
 * its own visual components — the backend only decides WHAT to show.
 */

import { VisualPlanPayload, SessionContext } from "@/types";
import { MathConcept } from "./concept_identifier";
import { Strand } from "@/types";

const STRAND_TO_DIAGRAM: Record<Strand, VisualPlanPayload["diagramType"]> = {
  [Strand.Numbers]: "number_line",
  [Strand.Operations]: "area_model",
  [Strand.Fractions]: "fraction_bar",
  [Strand.Decimals]: "number_line",
  [Strand.Geometry]: "graph",
  [Strand.Measurement]: "bar_model",
  [Strand.Algebra]: "table",
  [Strand.WordProblems]: "bar_model",
  [Strand.DataAndProbability]: "graph",
};

/**
 * Builds a visual explanation plan for a given concept.
 * Returns null if no visual representation would help.
 */
export async function buildVisualPlan(
  concept: MathConcept,
  _context: SessionContext
): Promise<VisualPlanPayload> {
  const diagramType = STRAND_TO_DIAGRAM[concept.strand] ?? "bar_model";

  // TODO: Build actual data payload based on the specific question values
  // In production, this would parse the question to extract numbers/values
  // and construct a meaningful diagram data structure.

  return {
    diagramType,
    data: buildPlaceholderData(diagramType),
    caption: `Visual explanation for: ${concept.name}`,
  };
}

function buildPlaceholderData(
  type: VisualPlanPayload["diagramType"]
): Record<string, unknown> {
  switch (type) {
    case "number_line":
      return { start: 0, end: 20, highlight: [], jumps: [] };
    case "area_model":
      return { rows: 3, cols: 4, labels: { row: "3", col: "4" } };
    case "fraction_bar":
      return { total: 8, shaded: 3, label: "3/8" };
    case "bar_model":
      return { parts: [], total: null };
    case "graph":
      return { points: [], xLabel: "x", yLabel: "y" };
    case "table":
      return { headers: [], rows: [] };
    default:
      return {};
  }
}
