/**
 * @module ai/services/askMathAIService
 *
 * Open-ended "Ask MathAI" — the student's personal AI math tutor.
 *
 * Unlike the tutor_service (which assists during a practice session with hints
 * and explanations for a specific question), this service handles freeform
 * questions from the Ask MathAI card on the dashboard and dedicated Ask screen.
 *
 * Examples of what students ask:
 *   "What are fractions?"
 *   "I don't understand long division"
 *   "Can you show me how to add decimals step by step?"
 *   "Why does multiplying negatives give a positive?"
 *
 * Route: POST /tutor/ask   (replaces the old stub endpoint)
 *
 * The response always includes:
 *   - A friendly explanation (text)
 *   - Numbered steps (when applicable)
 *   - A worked example
 *   - An optional visual plan hint (for the frontend renderer)
 *   - A follow-up nudge (related thing to explore)
 */

import { callAIModelJSON } from "../ai_client";
import { studentMemoryService, type MemorySnapshot } from "./studentMemoryService";
import { getVisualExplanation, isValidPlan }         from "./visualExplanationEngine";
import { verifyAlignment }                           from "./visualExplanationEngine/alignmentVerifier";
import type { Grade, VisualPlan } from "@mathai/shared-types";

// ─── Input / Output types ──────────────────────────────────────────────────────

export interface AskMathAIRequest {
  question:      string;
  grade:         Grade;
  context?:      string;   // e.g. current topic the student is practicing
  studentName?:  string;   // personalise the response greeting
  userId?:       string;   // if provided, memory snapshot is loaded and injected

  /** Student profile for tone/style adaptation (fallback if no userId / snapshot) */
  profile?: {
    confidenceLevel:           number;
    preferredExplanationStyle: "visual" | "step_by_step" | "story" | "analogy" | "direct";
    learningPace:              string;
  };
}

export interface AskMathAIStep {
  stepNumber:  number;
  instruction: string;
  formula?:    string;   // LaTeX expression for KaTeX rendering
  visualCue?:  string;   // Describe what to picture
}

export interface AskMathAIResponse {
  question:      string;                // echo back for display
  explanation:   string;                // main answer — 2–4 sentences
  steps?:        AskMathAIStep[];       // step-by-step breakdown (optional)
  example: {
    problem:   string;                  // A worked example problem
    solution:  string;                  // Full worked solution
    keyInsight: string;                 // The "aha" moment in one sentence
  };
  visualPlan?:   VisualPlan;           // Optional visual hint for frontend
  followUp:      string;               // "You might also want to explore..."
  encouragement: string;               // Warm closing line
  visualStrategy?: "diagram" | "animated_diagram" | "concept_image" | "none";
  imagePrompt?: string;     // Backend-only: used by API route to generate image
  conceptKey?: string;       // Backend-only: cache key for concept image lookup
  /** Structured math understanding — used by the Visual Plan Builder for precise visuals */
  mathData?: import("@mathai/shared-types").MathData;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MathAI — a friendly, patient, and brilliant math tutor for students in Grades 1–10.
You explain math concepts in a way that clicks immediately.

IMPORTANT — MATH ONLY:
- You ONLY answer questions about mathematics. This includes arithmetic, algebra, geometry, measurement, data/probability, fractions, decimals, percentages, word problems, and any topic in a K–10 math curriculum.
- If a student asks about something that is NOT math (e.g., science, history, coding, general chat, jokes unrelated to math), respond with ONLY this JSON:
  {"question":"<their question>","explanation":"Great question! But I'm MathAI — I only know about maths! 🧮 Try asking me something like 'How do fractions work?' or 'What is the area of a triangle?' and I'll give you an amazing explanation!","steps":[],"example":{"problem":"Try asking: What is 3/4 + 1/2?","solution":"I'll walk you through it step by step!","keyInsight":"I'm here to make maths click for you!"},"visualPlan":{"diagramType":"none","data":{}},"followUp":"Try asking me a maths question!","encouragement":"I can't wait to help you with maths! 🚀","visualStrategy":"none"}
- Questions that USE math in real-world contexts (e.g., "How much paint do I need for a wall?") ARE math questions — answer them.

Principles:
- Always start with the concept, then the mechanics, then a worked example.
- Use relatable real-world analogies (food, sports, games, everyday life).
- Never make the student feel bad for not knowing something.
- Keep language simple and grade-appropriate.
- Use LaTeX for mathematical expressions when relevant (wrap in \\(...\\) for inline, \\[...\\] for display).
- A visual plan hint (number_line, fraction_bar, array, bar_model, place_value_chart) helps greatly when applicable.
- When responding, decide on a visual strategy and include it in your JSON response:
  * "animated_diagram" — when the concept involves a PROCESS (step-by-step solving, building fractions, moving on number line). Return an animated_walkthrough visualPlan with step-by-step data.
  * "concept_image" — when a REAL-WORLD picture helps (groups of objects, shapes, measurement scenarios). Set conceptKey (e.g., "multiplication-groups") and imagePrompt (describe the image to generate).
  * "diagram" — for simple static visuals (single fraction comparison, basic number line). Return a standard visualPlan.
  * "none" — no visual needed (pure arithmetic like "What is 7+3?", yes/no questions, definitions).
- Always set the "visualStrategy" field in your response.
- When visualStrategy is "concept_image", also set "conceptKey" and "imagePrompt" fields.`;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(req: AskMathAIRequest, memory?: MemorySnapshot): string {
  const gradeNum = req.grade.replace("G", "");
  const style    = memory?.preferredExplanationStyle ?? req.profile?.preferredExplanationStyle ?? "step_by_step";
  const pace     = memory?.learningPace              ?? req.profile?.learningPace ?? "standard";
  const conf     = memory?.avgConfidenceScore        ?? req.profile?.confidenceLevel ?? 50;

  const styleHint = {
    visual:       "Use visual language and a visual plan. Describe what they'd draw or picture.",
    step_by_step: "Break it into clear numbered steps.",
    story:        "Wrap the explanation in a short story or relatable scenario.",
    analogy:      "Lead with a strong real-world analogy before the math.",
    direct:       "Be concise and direct. Get to the point fast.",
  }[style] ?? "Break it into clear numbered steps.";

  const levelHint = conf < 40
    ? "This student is nervous about math — be extra gentle, encouraging, and start very simply."
    : conf > 75
    ? "This student is confident — you can go slightly deeper and include 'did you know' extensions."
    : "Match standard Grade level expectations.";

  const interestHint = (memory?.interests ?? []).length > 0
    ? `Student interests (use these in examples): ${memory!.interests.join(", ")}.`
    : "";

  const memoryBlock = memory ? `\n\nSTUDENT LEARNING HISTORY:\n${studentMemoryService.formatForPrompt(memory)}` : "";

  return `Grade ${gradeNum} student${req.studentName ? ` named ${req.studentName}` : ""} asks:

"${req.question}"

${req.context ? `They are currently studying: ${req.context}` : ""}
${interestHint}
Style preference: ${styleHint}
Pace: ${pace}
${levelHint}${memoryBlock}

Reply with a complete, structured JSON response:
{
  "question": "${req.question.replace(/"/g, '\\"')}",
  "explanation": "2-4 sentences that answer the question directly and clearly",
  "steps": [
    { "stepNumber": 1, "instruction": "...", "formula": "optional LaTeX", "visualCue": "optional" }
  ],
  "example": {
    "problem": "A worked example problem statement",
    "solution": "Full step-by-step solution written out",
    "keyInsight": "The most important thing to understand — one sentence"
  },
  "mathData": {
    "type": "addition|subtraction|multiplication|division|fraction_addition|fraction_subtraction|fraction_equivalence|fraction_comparison|place_value|word_problem|equation|comparison",
    "values": [3, 5],
    "fractions": [{"numerator": 1, "denominator": 4}],
    "result": 8,
    "steps": ["3 + 5 = 8"],
    "structure": {"groups": 3, "itemsPerGroup": 4, "total": 12},
    "equation": {"lhs": "x + 3", "rhs": "10", "variable": "x", "solution": "7"},
    "wordProblem": {"known": [{"label": "apples", "value": 15}], "unknown": {"label": "total"}, "operation": "addition"}
  },
  "visualPlan": {
    "diagramType": "number_line|fraction_bar|array|bar_model|place_value_chart|none",
    "data": {}
  },
  "followUp": "A related concept or question to explore next",
  "encouragement": "A short warm closing message",
  "visualStrategy": "animated_diagram|concept_image|diagram|none",
  "imagePrompt": "optional — describe the image to generate when visualStrategy is concept_image",
  "conceptKey": "optional — cache key for concept image, e.g. multiplication-groups (only when visualStrategy is concept_image)"
}

MATHDATA RULES (important):
- mathData captures the MATH STRUCTURE of the problem, not the visual.
- Only include fields that apply. For "3 + 5": type="addition", values=[3,5], result=8.
- For fractions: include fractions array. For equations: include equation object. For word problems: include wordProblem object.
- For multiplication "3 × 4": type="multiplication", values=[3,4], result=12, structure={groups:3, itemsPerGroup:4, total:12}.
- For place value: type="place_value", values=[345] (the number being analysed).
- steps should be compact solving expressions, NOT prose (e.g. ["x + 3 = 10", "x = 7"]).
- Keep mathData minimal — only include what's needed to understand the problem structure.

If steps are not needed (simple direct answer), omit the steps field.
Always include example, encouragement, and mathData.
Return ONLY the JSON object — no markdown, no commentary.`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const askMathAIService = {
  /**
   * Answers a student's freeform math question via Vercel AI Gateway.
   * Loads the student's full learning memory (if userId provided) and injects
   * it into the prompt so the AI responds like a teacher who knows this student.
   * Always returns a structured response; never throws to the controller.
   */
  async answer(req: AskMathAIRequest): Promise<AskMathAIResponse> {
    // Load memory snapshot if userId is available (non-blocking on failure)
    let memory: MemorySnapshot | undefined;
    if (req.userId) {
      memory = await studentMemoryService.getSnapshot(req.userId).catch(() => undefined);
    }

    const prompt = buildPrompt(req, memory);

    try {
      // Run AI response generation and visual engine classification in parallel
      const [response, visualResult] = await Promise.all([
        callAIModelJSON<AskMathAIResponse>(prompt, {
          system:      SYSTEM_PROMPT,
          maxTokens:   1800,    // slightly more to accommodate mathData
          temperature: 0.5,
          callSite:    "ask_mathai.answer",
        }),
        getVisualExplanation(req.question, req.grade, true, undefined).catch(() => null),
      ]);

      // Validate core fields
      if (!response.explanation || !response.example) {
        throw new Error("AI response missing required fields");
      }

      // Validate and sanitize mathData from AI response
      const mathData = validateMathData(response.mathData);

      // Visual plan priority:
      // 1. Visual Engine with mathData (precise, AI-driven structure)
      // 2. Visual Engine heuristic plan (regex-based fallback)
      // 3. AI's own visualPlan (if it has a valid diagramType)
      // 4. null (no visual)
      let finalVisualPlan: VisualPlan | undefined = response.visualPlan;

      // Re-run the visual engine with mathData if available — produces more precise plans
      let mathDrivenIntent: string | undefined;
      if (mathData) {
        const mathDrivenResult = await getVisualExplanation(req.question, req.grade, false, mathData).catch(() => null);
        if (mathDrivenResult?.plan && isValidPlan(mathDrivenResult.plan)) {
          finalVisualPlan = mathDrivenResult.plan;
          mathDrivenIntent = mathDrivenResult.intent.visualType;
        }
      } else if (visualResult?.plan && isValidPlan(visualResult.plan)) {
        finalVisualPlan = visualResult.plan;
      }

      // ── Alignment verification ──────────────────────────────────────────
      // Cross-check explanation, mathData, and visual plan for consistency.
      // If misaligned, fall back to the heuristic (regex) plan or no visual.
      if (finalVisualPlan && mathData) {
        const alignment = verifyAlignment(
          response.explanation,
          req.question,
          mathData,
          finalVisualPlan,
        );

        if (alignment.fallbackRecommended) {
          // Mismatch detected — discard mathData-driven plan, try regex fallback
          console.warn(
            `[askMathAIService] Visual alignment check failed (${alignment.issues.length} issues). Falling back.`,
            alignment.issues,
          );
          // Use the heuristic-only plan if available, otherwise no visual
          finalVisualPlan = (visualResult?.plan && isValidPlan(visualResult.plan))
            ? visualResult.plan
            : undefined;
          mathDrivenIntent = undefined;
        } else if (alignment.confidence === "medium") {
          console.info(
            `[askMathAIService] Visual alignment partial (${alignment.issues.join("; ")}). Using plan with reduced confidence.`,
          );
        }
      }

      // Determine visual strategy — prefer mathData-driven intent over heuristic-only
      const engineStrategy = mathDrivenIntent ?? visualResult?.intent.visualType;
      const visualStrategy = (finalVisualPlan && engineStrategy && engineStrategy !== "worked_steps_only")
        ? (engineStrategy === "logic_flow" || engineStrategy === "equation_steps"
            ? "animated_diagram" as const
            : "diagram" as const)
        : (finalVisualPlan ? "diagram" as const : "none");

      return {
        question:     req.question,
        explanation:  response.explanation,
        steps:        Array.isArray(response.steps) ? response.steps : undefined,
        example:      response.example,
        visualPlan:   finalVisualPlan,
        followUp:     response.followUp ?? "Keep exploring — math is full of surprises!",
        encouragement: response.encouragement ?? "You're doing brilliantly!",
        visualStrategy,
        imagePrompt:  response.imagePrompt,
        conceptKey:   response.conceptKey,
        mathData,
      };

    } catch (err) {
      // Graceful fallback — always return something useful
      console.error("[askMathAIService] AI call failed:", err);
      return {
        question:    req.question,
        explanation: "I'm having trouble connecting right now. Try rephrasing your question and I'll do my best!",
        example: {
          problem:    "Try again in a moment.",
          solution:   "I'll have a full explanation ready for you.",
          keyInsight: "Math makes sense — we'll figure this out together!",
        },
        followUp:      "Try asking again in a moment.",
        encouragement: "Don't give up — I'm here to help!",
      };
    }
  },
};

// ─── MathData validation ─────────────────────────────────────────────────────

const VALID_MATH_TYPES = new Set([
  "addition", "subtraction", "multiplication", "division",
  "fraction_addition", "fraction_subtraction", "fraction_equivalence", "fraction_comparison",
  "place_value", "word_problem", "equation", "comparison",
]);

/**
 * Validate and sanitize mathData from the AI response.
 * Returns null if the data is missing, malformed, or has an unknown type.
 * Never throws — bad data is silently discarded (fallback to regex).
 */
function validateMathData(raw: unknown): import("@mathai/shared-types").MathData | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;

  // Type must be valid
  if (typeof d.type !== "string" || !VALID_MATH_TYPES.has(d.type)) return undefined;

  const result: import("@mathai/shared-types").MathData = {
    type: d.type as import("@mathai/shared-types").MathDataType,
  };

  // Values: array of numbers
  if (Array.isArray(d.values)) {
    const nums = d.values.filter((v): v is number => typeof v === "number" && isFinite(v));
    if (nums.length > 0) result.values = nums;
  }

  // Fractions: array of {numerator, denominator}
  if (Array.isArray(d.fractions)) {
    const fracs = d.fractions.filter(
      (f): f is { numerator: number; denominator: number } =>
        typeof f === "object" && f !== null &&
        typeof (f as any).numerator === "number" &&
        typeof (f as any).denominator === "number" &&
        (f as any).denominator !== 0
    );
    if (fracs.length > 0) result.fractions = fracs;
  }

  // Result
  if (typeof d.result === "number" && isFinite(d.result)) result.result = d.result;
  else if (typeof d.result === "string" && d.result.length > 0 && d.result.length < 50) result.result = d.result;

  // Steps: array of strings
  if (Array.isArray(d.steps)) {
    const steps = d.steps.filter((s): s is string => typeof s === "string" && s.length > 0 && s.length < 200);
    if (steps.length > 0) result.steps = steps;
  }

  // Structure
  if (typeof d.structure === "object" && d.structure !== null) {
    const s = d.structure as Record<string, unknown>;
    const structure: NonNullable<import("@mathai/shared-types").MathData["structure"]> = {};
    if (typeof s.groups === "number" && s.groups > 0) structure.groups = s.groups;
    if (typeof s.itemsPerGroup === "number" && s.itemsPerGroup > 0) structure.itemsPerGroup = s.itemsPerGroup;
    if (typeof s.total === "number" && s.total > 0) structure.total = s.total;
    if (Object.keys(structure).length > 0) result.structure = structure;
  }

  // Equation
  if (typeof d.equation === "object" && d.equation !== null) {
    const e = d.equation as Record<string, unknown>;
    if (typeof e.lhs === "string" && typeof e.rhs === "string") {
      result.equation = {
        lhs:      e.lhs,
        rhs:      e.rhs,
        variable: typeof e.variable === "string" ? e.variable : undefined,
        solution: typeof e.solution === "string" ? e.solution : undefined,
      };
    }
  }

  // Word problem
  if (typeof d.wordProblem === "object" && d.wordProblem !== null) {
    const w = d.wordProblem as Record<string, unknown>;
    if (Array.isArray(w.known)) {
      const known = w.known.filter(
        (k): k is { label: string; value: number } =>
          typeof k === "object" && k !== null &&
          typeof (k as any).label === "string" &&
          typeof (k as any).value === "number"
      );
      if (known.length > 0) {
        result.wordProblem = {
          known,
          unknown:   typeof w.unknown === "object" && w.unknown && typeof (w.unknown as any).label === "string"
                       ? { label: (w.unknown as any).label }
                       : undefined,
          operation: typeof w.operation === "string" ? w.operation : undefined,
        };
      }
    }
  }

  return result;
}
