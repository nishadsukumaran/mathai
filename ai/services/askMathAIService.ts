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
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MathAI — a friendly, patient, and brilliant math tutor for students in Grades 1–10.
You explain math concepts in a way that clicks immediately.

Principles:
- Always start with the concept, then the mechanics, then a worked example.
- Use relatable real-world analogies (food, sports, games, everyday life).
- Never make the student feel bad for not knowing something.
- Keep language simple and grade-appropriate.
- Use LaTeX for mathematical expressions when relevant (wrap in \\(...\\) for inline, \\[...\\] for display).
- A visual plan hint (number_line, fraction_bar, array, bar_model, place_value_chart) helps greatly when applicable.`;

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
  "visualPlan": {
    "diagramType": "number_line|fraction_bar|array|bar_model|place_value_chart|none",
    "data": {}
  },
  "followUp": "A related concept or question to explore next",
  "encouragement": "A short warm closing message"
}

If steps are not needed (simple direct answer), omit the steps field.
Always include example and encouragement.
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
      const response = await callAIModelJSON<AskMathAIResponse>(prompt, {
        system:      SYSTEM_PROMPT,
        maxTokens:   1500,
        temperature: 0.5,
        callSite:    "ask_mathai.answer",
      });

      // Validate core fields
      if (!response.explanation || !response.example) {
        throw new Error("AI response missing required fields");
      }

      return {
        question:     req.question,
        explanation:  response.explanation,
        steps:        Array.isArray(response.steps) ? response.steps : undefined,
        example:      response.example,
        visualPlan:   response.visualPlan,
        followUp:     response.followUp ?? "Keep exploring — math is full of surprises!",
        encouragement: response.encouragement ?? "You're doing brilliantly!",
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
