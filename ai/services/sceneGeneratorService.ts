/**
 * @module ai/services/sceneGeneratorService
 *
 * Generates ScenePlan JSON via AI for math topics that don't have templates.
 * Uses a strict prompt with the full schema and few-shot example to keep
 * the AI within the allowed primitives/animations/palettes.
 *
 * Safety:
 *   - Output is validated with Zod before returning
 *   - Invalid plans fall back to text-only scene
 *   - AI is explicitly told not to invent new types
 */

import { callAIModelJSON } from "../ai_client";
import type { MathData }   from "../../packages/shared-types";

// ─── Types (duplicated from frontend for backend use) ────────────────────────
// These mirror the Zod schemas in apps/web/lib/scene-engine/types.ts
// but are kept as plain TS here to avoid cross-package imports.

interface SceneAnimation {
  target:   string;
  preset:   "fadeIn" | "pop" | "slideUp" | "slideLeft" | "highlight" | "move" | "draw" | "crossOut";
  delay:    number;
  duration: number;
  params?:  { to?: { x: number; y: number }; color?: string };
}

interface SceneElement {
  id:    string;
  type:  "dot" | "bar" | "numberLine" | "mathText" | "arrow" | "brace" | "group";
  props: Record<string, unknown>;
}

interface SceneStep {
  id:         string;
  duration:   number;
  narration?: string;
  elements:   SceneElement[];
  animations: SceneAnimation[];
}

export interface ScenePlan {
  id:       string;
  title:    string;
  topic:    string;
  grade?:   string;
  palette:  "ocean" | "sunset" | "forest" | "candy";
  duration: number;
  steps:    SceneStep[];
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a visual math explanation designer for children (grades 1-8).
You create structured scene plans rendered as SVG animations.

STRICT RULES:
- Output ONLY valid JSON matching the ScenePlan schema below.
- Use ONLY these primitive types: dot, bar, numberLine, mathText, arrow, brace, group
- Use ONLY these animation presets: fadeIn, pop, slideUp, slideLeft, highlight, move, draw, crossOut
- Use ONLY these palette keys: ocean, sunset, forest, candy
- Maximum 8 steps per scene, maximum 30 seconds total duration
- Each step duration must be 0.5 to 10 seconds
- All coordinates in 800x500 SVG viewBox space
- Narration must be child-friendly, max 200 chars, encouraging
- Do NOT invent new types, animations, palettes, or schema fields
- Do NOT use LaTeX or complex math notation in narration — use plain words

SCHEMA:
{
  "id": string,
  "title": string (max 100 chars),
  "topic": string (max 60 chars),
  "palette": "ocean" | "sunset" | "forest" | "candy",
  "duration": number (1-30, total seconds),
  "steps": [
    {
      "id": string,
      "duration": number (0.5-10),
      "narration": string (max 200 chars, child-friendly),
      "elements": [
        {
          "id": string (unique within step),
          "type": "dot" | "bar" | "numberLine" | "mathText" | "arrow" | "brace" | "group",
          "props": { ... type-specific properties }
        }
      ],
      "animations": [
        {
          "target": string (must match an element id in this step),
          "preset": "fadeIn" | "pop" | "slideUp" | "slideLeft" | "highlight" | "move" | "draw" | "crossOut",
          "delay": number (0-10),
          "duration": number (0.1-5)
        }
      ]
    }
  ]
}

PRIMITIVE PROPS:
- dot: { cx, cy, r, fill, label? }
- bar: { x, y, width, height, fill, divisions?, filledDivisions?, rx?, label? }
- numberLine: { x1, y1, x2, min, max, step, markers?, hops? }
- mathText: { x, y, text, fontSize?, color?, anchor?, fontWeight? }
- arrow: { x1, y1, x2, y2, color?, label?, curved?, curveHeight? }
- brace: { x, y, width, height, side?, label?, color? }
- group: { x, y, width, height, outline?, outlineColor?, fill?, rx?, label? }

DESIGN PRINCIPLES:
- Follow a 3-act structure: setup (show question), build (construct visual), payoff (reveal answer)
- Stagger element appearances (0.1s gaps between items) for cascade effect
- Use "pop" for the final answer reveal
- Keep it clean and spacious — don't crowd the 800x500 canvas
- Center important elements horizontally around x=400`;

const EXAMPLE_PLAN = `{
  "id": "place-value-352",
  "title": "What is the value of each digit in 352?",
  "topic": "Place Value",
  "palette": "ocean",
  "duration": 12,
  "steps": [
    {
      "id": "show",
      "duration": 3,
      "narration": "Let's break down the number 352.",
      "elements": [
        { "id": "title", "type": "mathText", "props": { "x": 400, "y": 80, "text": "352", "fontSize": 48, "anchor": "middle" } }
      ],
      "animations": [
        { "target": "title", "preset": "pop", "delay": 0, "duration": 0.5 }
      ]
    },
    {
      "id": "break",
      "duration": 5,
      "narration": "3 hundreds, 5 tens, and 2 ones.",
      "elements": [
        { "id": "h-label", "type": "mathText", "props": { "x": 200, "y": 160, "text": "Hundreds", "fontSize": 16, "color": "#64748b", "anchor": "middle" } },
        { "id": "h-bar", "type": "bar", "props": { "x": 140, "y": 180, "width": 120, "height": 140, "fill": "#6366f1", "divisions": 10, "filledDivisions": 3, "rx": 6 } },
        { "id": "h-val", "type": "mathText", "props": { "x": 200, "y": 350, "text": "300", "fontSize": 24, "anchor": "middle" } },
        { "id": "t-label", "type": "mathText", "props": { "x": 400, "y": 160, "text": "Tens", "fontSize": 16, "color": "#64748b", "anchor": "middle" } },
        { "id": "t-bar", "type": "bar", "props": { "x": 340, "y": 180, "width": 120, "height": 140, "fill": "#06b6d4", "divisions": 10, "filledDivisions": 5, "rx": 6 } },
        { "id": "t-val", "type": "mathText", "props": { "x": 400, "y": 350, "text": "50", "fontSize": 24, "anchor": "middle" } },
        { "id": "o-label", "type": "mathText", "props": { "x": 600, "y": 160, "text": "Ones", "fontSize": 16, "color": "#64748b", "anchor": "middle" } },
        { "id": "o-bar", "type": "bar", "props": { "x": 540, "y": 180, "width": 120, "height": 140, "fill": "#f59e0b", "divisions": 10, "filledDivisions": 2, "rx": 6 } },
        { "id": "o-val", "type": "mathText", "props": { "x": 600, "y": 350, "text": "2", "fontSize": 24, "anchor": "middle" } }
      ],
      "animations": [
        { "target": "h-label", "preset": "fadeIn", "delay": 0, "duration": 0.3 },
        { "target": "h-bar", "preset": "slideUp", "delay": 0.2, "duration": 0.5 },
        { "target": "h-val", "preset": "fadeIn", "delay": 0.6, "duration": 0.3 },
        { "target": "t-label", "preset": "fadeIn", "delay": 1.0, "duration": 0.3 },
        { "target": "t-bar", "preset": "slideUp", "delay": 1.2, "duration": 0.5 },
        { "target": "t-val", "preset": "fadeIn", "delay": 1.6, "duration": 0.3 },
        { "target": "o-label", "preset": "fadeIn", "delay": 2.0, "duration": 0.3 },
        { "target": "o-bar", "preset": "slideUp", "delay": 2.2, "duration": 0.5 },
        { "target": "o-val", "preset": "fadeIn", "delay": 2.6, "duration": 0.3 }
      ]
    },
    {
      "id": "answer",
      "duration": 3,
      "narration": "352 is 300 + 50 + 2. Great job!",
      "elements": [
        { "id": "result", "type": "mathText", "props": { "x": 400, "y": 250, "text": "352 = 300 + 50 + 2", "fontSize": 32, "anchor": "middle", "fontWeight": "black" } }
      ],
      "animations": [
        { "target": "result", "preset": "pop", "delay": 0.3, "duration": 0.5 }
      ]
    }
  ]
}`;

// ─── Generator ───────────────────────────────────────────────────────────────

export async function generateScenePlan(
  question: string,
  mathData: MathData,
  grade: string = "G4",
): Promise<ScenePlan> {
  const userPrompt = [
    `Create an animated scene plan for this math question:`,
    `Question: "${question}"`,
    `Grade: ${grade}`,
    `Math type: ${mathData.type}`,
    mathData.values?.length  ? `Values: ${JSON.stringify(mathData.values)}` : "",
    mathData.result          ? `Answer: ${mathData.result}` : "",
    mathData.fractions?.length ? `Fractions: ${JSON.stringify(mathData.fractions)}` : "",
    mathData.equation        ? `Equation: ${JSON.stringify(mathData.equation)}` : "",
    mathData.wordProblem     ? `Word problem: ${JSON.stringify(mathData.wordProblem)}` : "",
    "",
    `Here is an example of a valid scene plan:`,
    EXAMPLE_PLAN,
    "",
    `Now generate a scene plan for the question above. Output ONLY the JSON, no explanation.`,
  ].filter(Boolean).join("\n");

  const plan = await callAIModelJSON<ScenePlan>(
    `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    { callSite: "scene_generator" }
  );

  return plan;
}
