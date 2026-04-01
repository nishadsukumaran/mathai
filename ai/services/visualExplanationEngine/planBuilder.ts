/**
 * @module ai/services/visualExplanationEngine/planBuilder
 *
 * Transforms a VisualIntent + math data into a renderer-ready VisualPlan.
 *
 * TWO-TIER STRATEGY:
 *   1. If structured mathData is available (from AI response) → build precise plan
 *   2. Otherwise → fall back to regex-based extraction from question text
 *
 * This is a DETERMINISTIC layer — no AI calls. All rendering data is built
 * from either structured mathData or parsed question text.
 */

import type {
  VisualPlan,
  NumberLineData,
  FractionBarData,
  ArrayData,
  BarModelData,
  PlaceValueChartData,
  EquationStepsData,
  LogicFlowData,
  MathData,
} from "@mathai/shared-types";
import type { VisualIntent, VisualType } from "./classifier";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

// ─── MathData → VisualPlan builders (PRECISE, structured) ────────────────────

function buildFromMathData(intent: VisualIntent, md: MathData): VisualPlan | null {
  switch (intent.visualType) {
    case "number_line":   return buildNumberLineFromData(md);
    case "fraction_bar":  return buildFractionBarFromData(md);
    case "array_model":   return buildArrayFromData(md);
    case "place_value":   return buildPlaceValueFromData(md);
    case "bar_model":     return buildBarModelFromData(md);
    case "equation_steps": return buildEquationFromData(md);
    default:              return null;
  }
}

function buildNumberLineFromData(md: MathData): VisualPlan | null {
  const vals = md.values;
  if (!vals || vals.length < 2) return null;

  const a = vals[0]!;
  const b = vals[1]!;
  const res = typeof md.result === "number" ? md.result : a + b;
  const allNums = [a, b, res];
  const min = Math.min(...allNums) - 2;
  const max = Math.max(...allNums) + 2;
  const range = max - min;
  const step = range <= 20 ? 1 : Math.ceil(range / 10);

  const isSubtraction = md.type === "subtraction";
  const data: NumberLineData = {
    min, max, step,
    point: a,
    arrow: {
      from:  a,
      to:    res,
      label: isSubtraction ? `−${Math.abs(b)}` : `+${b}`,
    },
  };

  return { diagramType: "number_line", data };
}

function buildFractionBarFromData(md: MathData): VisualPlan | null {
  const fracs = md.fractions;
  if (!fracs || fracs.length === 0) return null;

  const fractions = fracs.map((f, i) => ({
    numerator:   f.numerator,
    denominator: f.denominator,
    label:       `${f.numerator}/${f.denominator}`,
    color:       COLORS[i % COLORS.length],
  }));

  const isEquivalence = md.type === "fraction_equivalence" || md.type === "fraction_comparison";

  const data: FractionBarData = {
    fractions,
    showEquivalent: isEquivalence,
  };

  return { diagramType: "fraction_bar", data };
}

function buildArrayFromData(md: MathData): VisualPlan | null {
  const s = md.structure;
  if (s?.groups && s.itemsPerGroup) {
    return {
      diagramType: "array",
      data: {
        rows: Math.min(s.groups, 10),
        cols: Math.min(s.itemsPerGroup, 10),
      } as ArrayData,
    };
  }

  // Fallback: use values as rows × cols
  const vals = md.values;
  if (vals && vals.length >= 2) {
    return {
      diagramType: "array",
      data: {
        rows: Math.min(Math.abs(Math.round(vals[0]!)), 10),
        cols: Math.min(Math.abs(Math.round(vals[1]!)), 10),
      } as ArrayData,
    };
  }

  return null;
}

function buildPlaceValueFromData(md: MathData): VisualPlan | null {
  const vals = md.values;
  const num = vals && vals.length > 0
    ? Math.abs(Math.round(vals[0]!))
    : typeof md.result === "number" ? Math.abs(Math.round(md.result)) : null;

  if (num === null || num === 0) return null;

  const str = String(Math.min(num, 9999));
  const digits: Record<string, number> = {};
  const places = ["ones", "tens", "hundreds", "thousands"];

  for (let i = 0; i < str.length; i++) {
    const placeIdx = str.length - 1 - i;
    if (placeIdx < places.length) {
      digits[places[placeIdx]!] = Number(str[i]);
    }
  }

  const data: PlaceValueChartData = {
    digits,
    highlight: Object.keys(digits),
  };

  return { diagramType: "place_value_chart", data };
}

function buildBarModelFromData(md: MathData): VisualPlan | null {
  // Try wordProblem structure first
  if (md.wordProblem?.known && md.wordProblem.known.length > 0) {
    const bars = md.wordProblem.known.map((k, i) => ({
      label: k.label,
      value: k.value,
      color: COLORS[i % COLORS.length],
    }));
    const total = bars.reduce((s, b) => s + b.value, 0);

    return {
      diagramType: "bar_model",
      data: {
        bars,
        total: { label: md.wordProblem.unknown?.label ?? `Total: ${total}` },
      } as BarModelData,
    };
  }

  // Fallback to raw values
  const vals = md.values?.filter((v) => v > 0);
  if (vals && vals.length >= 2) {
    const bars = vals.slice(0, 3).map((v, i) => ({
      label: `Part ${i + 1}`,
      value: v,
      color: COLORS[i % COLORS.length],
    }));
    const total = bars.reduce((s, b) => s + b.value, 0);

    return {
      diagramType: "bar_model",
      data: { bars, total: { label: `Total: ${total}` } } as BarModelData,
    };
  }

  return null;
}

function buildEquationFromData(md: MathData): VisualPlan | null {
  // Use equation structure if available
  if (md.equation) {
    const steps: EquationStepsData["steps"] = [
      { label: "Start with the equation", expression: `${md.equation.lhs} = ${md.equation.rhs}` },
    ];

    // Add solving steps from mathData
    if (md.steps && md.steps.length > 0) {
      for (const s of md.steps) {
        steps.push({ label: "Solve", expression: s });
      }
    }

    if (md.equation.solution) {
      steps.push({
        label:  "Solution",
        expression: `${md.equation.variable ?? "x"} = ${md.equation.solution}`,
        result: `${md.equation.variable ?? "x"} = ${md.equation.solution}`,
      });
    }

    return {
      diagramType: "equation_steps",
      data: { title: "Solving Step by Step", steps } as EquationStepsData,
    };
  }

  // Fallback: use steps array directly
  if (md.steps && md.steps.length > 0) {
    const steps = md.steps.map((s, i) => ({
      label:      i === 0 ? "Start" : i === md.steps!.length - 1 ? "Result" : `Step ${i}`,
      expression: s,
    }));

    return {
      diagramType: "equation_steps",
      data: { title: "Solving Step by Step", steps } as EquationStepsData,
    };
  }

  return null;
}

// ─── MathData type → VisualType mapping ──────────────────────────────────────

const MATHDATA_TYPE_MAP: Record<string, VisualType> = {
  addition:             "number_line",
  subtraction:          "number_line",
  multiplication:       "array_model",
  division:             "array_model",
  fraction_addition:    "fraction_bar",
  fraction_subtraction: "fraction_bar",
  fraction_equivalence: "fraction_bar",
  fraction_comparison:  "fraction_bar",
  place_value:          "place_value",
  word_problem:         "bar_model",
  equation:             "equation_steps",
  comparison:           "bar_model",
};

// ─── Regex-based fallback builders (original system) ─────────────────────────

function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function extractFractions(text: string): Array<[number, number]> {
  const matches = [...text.matchAll(/(\d+)\s*\/\s*(\d+)/g)];
  return matches.map((m) => [Number(m[1]), Number(m[2])]);
}

function extractEquation(text: string): { lhs: string; rhs: string } | null {
  const match = text.match(/([^=]+)=([^=]+)/);
  if (!match) return null;
  return { lhs: match[1]!.trim(), rhs: match[2]!.trim() };
}

function buildNumberLineFallback(question: string): VisualPlan {
  const nums = extractNumbers(question);
  const min = nums.length >= 2 ? Math.min(...nums) - 2 : 0;
  const max = nums.length >= 2 ? Math.max(...nums) + 2 : 10;
  const step = max - min <= 20 ? 1 : Math.ceil((max - min) / 10);
  const data: NumberLineData = { min, max, step };
  if (nums.length >= 2) {
    data.arrow = { from: nums[0]!, to: nums[1]!, label: `${nums[1]! > nums[0]! ? "+" : ""}${nums[1]! - nums[0]!}` };
    data.point = nums[0]!;
  } else if (nums.length === 1) {
    data.point = nums[0]!;
  }
  return { diagramType: "number_line", data };
}

function buildFractionBarFallback(question: string): VisualPlan {
  const fracs = extractFractions(question);
  const fractions = fracs.length > 0
    ? fracs.map((f, i) => ({ numerator: f[0], denominator: f[1], label: `${f[0]}/${f[1]}`, color: COLORS[i % COLORS.length] }))
    : [{ numerator: 1, denominator: 4, label: "1/4", color: COLORS[0] }];
  return { diagramType: "fraction_bar", data: { fractions, showEquivalent: question.toLowerCase().includes("equivalent") } };
}

function buildArrayFallback(question: string): VisualPlan {
  const nums = extractNumbers(question).filter((n) => n > 0 && n <= 12);
  return { diagramType: "array", data: { rows: Math.min(nums[0] ?? 3, 10), cols: Math.min(nums[1] ?? 4, 10) } as ArrayData };
}

function buildPlaceValueFallback(question: string): VisualPlan {
  const nums = extractNumbers(question).filter((n) => n > 0 && Number.isInteger(n));
  const num = nums.length > 0 ? Math.max(...nums) : 345;
  const str = String(Math.min(Math.abs(Math.round(num)), 9999));
  const digits: Record<string, number> = {};
  const places = ["ones", "tens", "hundreds", "thousands"];
  for (let i = 0; i < str.length; i++) {
    const placeIdx = str.length - 1 - i;
    if (placeIdx < places.length) digits[places[placeIdx]!] = Number(str[i]);
  }
  return { diagramType: "place_value_chart", data: { digits, highlight: Object.keys(digits) } };
}

function buildBarModelFallback(question: string): VisualPlan {
  const nums = extractNumbers(question).filter((n) => n > 0);
  const bars = nums.length >= 2
    ? nums.slice(0, 3).map((n, i) => ({ label: `Part ${i + 1}`, value: n, color: COLORS[i % COLORS.length] }))
    : [{ label: "Known", value: 20, color: COLORS[0] }, { label: "Unknown", value: 15, color: COLORS[1] }];
  const total = bars.reduce((s, b) => s + b.value, 0);
  return { diagramType: "bar_model", data: { bars, total: { label: `Total: ${total}` } } };
}

function buildEquationFallback(question: string): VisualPlan {
  const eq = extractEquation(question);
  const steps: EquationStepsData["steps"] = eq
    ? [
        { label: "Start with the equation", expression: `${eq.lhs} = ${eq.rhs}` },
        { label: "Isolate the variable", expression: "Apply inverse operations to both sides" },
        { label: "Simplify", expression: "Calculate the result" },
      ]
    : [
        { label: "Write the equation", expression: "Set up the problem" },
        { label: "Simplify step by step", expression: "Apply operations" },
        { label: "Check your answer", expression: "Substitute back" },
      ];
  return { diagramType: "equation_steps", data: { title: "Solving Step by Step", steps } };
}

// ─── Fallback type map ───────────────────────────────────────────────────────

const FALLBACK_MAP: Record<VisualType, (question: string) => VisualPlan | null> = {
  number_line:       buildNumberLineFallback,
  fraction_bar:      buildFractionBarFallback,
  array_model:       buildArrayFallback,
  place_value:       buildPlaceValueFallback,
  bar_model:         buildBarModelFallback,
  equation_steps:    buildEquationFallback,
  logic_flow:        () => null,
  geometry_sketch:   () => null,
  comparison_model:  () => null,
  worked_steps_only: () => null,
};

// ─── Main plan builder ───────────────────────────────────────────────────────

/**
 * Build a renderer-ready VisualPlan from a classified intent, question text,
 * and optional structured mathData.
 *
 * Strategy:
 *   1. If mathData is available → build precise plan from structured data
 *   2. If mathData missing/incomplete → fall back to regex extraction
 *   3. Return null if no visual is appropriate
 */
export function buildVisualPlan(
  intent: VisualIntent,
  question: string,
  mathData?: MathData,
): VisualPlan | null {
  if (intent.visualType === "worked_steps_only") return null;

  // ── Strategy 1: mathData-driven plan (precise) ──────────────────────────
  if (mathData) {
    // Override intent visual type if mathData type maps to a different visual
    const mathDrivenType = MATHDATA_TYPE_MAP[mathData.type];
    const effectiveIntent = mathDrivenType
      ? { ...intent, visualType: mathDrivenType }
      : intent;

    const plan = buildFromMathData(effectiveIntent, mathData);
    if (plan && isValidPlan(plan)) return plan;
    // mathData didn't produce a valid plan — fall through to regex
  }

  // ── Strategy 2: regex fallback (original system) ────────────────────────
  const builder = FALLBACK_MAP[intent.visualType];
  if (!builder) return null;

  return builder(question);
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function isValidPlan(plan: VisualPlan | null): plan is VisualPlan {
  if (!plan) return false;
  if (!plan.data) return false;

  switch (plan.diagramType) {
    case "number_line": {
      const d = plan.data as NumberLineData;
      return typeof d.min === "number" && typeof d.max === "number" && d.max > d.min;
    }
    case "fraction_bar": {
      const d = plan.data as FractionBarData;
      return Array.isArray(d.fractions) && d.fractions.length > 0;
    }
    case "array": {
      const d = plan.data as ArrayData;
      return d.rows > 0 && d.cols > 0;
    }
    case "bar_model": {
      const d = plan.data as BarModelData;
      return Array.isArray(d.bars) && d.bars.length > 0;
    }
    case "place_value_chart": {
      const d = plan.data as PlaceValueChartData;
      return typeof d.digits === "object" && Object.keys(d.digits).length > 0;
    }
    case "equation_steps": {
      const d = plan.data as EquationStepsData;
      return Array.isArray(d.steps) && d.steps.length > 0;
    }
    case "logic_flow": {
      const d = plan.data as LogicFlowData;
      return Array.isArray(d.nodes) && d.nodes.length > 0;
    }
    default:
      return true;
  }
}
