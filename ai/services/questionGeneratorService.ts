/**
 * @module ai/services/questionGeneratorService
 *
 * AI-first practice question generation.
 *
 * Instead of fetching static questions from a content DB, MathAI generates
 * questions dynamically via the Vercel AI Gateway — personalised to the
 * student's grade, topic, difficulty, learning pace, and interest keywords.
 *
 * This is the primary engine for all practice sessions.
 *
 * ─── ARCHITECTURE ─────────────────────────────────────────────────────────────
 *
 *   practiceService.startSession()
 *     → questionGeneratorService.generate(context)
 *       → callAIModelJSON<AIGeneratedQuestion[]>(prompt)   [via Vercel AI Gateway]
 *         → returned questions stored in ACTIVE_SESSIONS
 *
 * ─── FALLBACK ─────────────────────────────────────────────────────────────────
 *
 *   If AI generation fails (gateway down, timeout, parse error):
 *   → Falls back to practiceGenerator (static curriculum) gracefully.
 *   → A warning is logged; the student never sees a broken screen.
 */

import { callAIModelJSON } from "../ai_client";
import type { Grade, Difficulty, PracticeMode } from "@mathai/shared-types";

// ─── Input / Output types ──────────────────────────────────────────────────────

export interface GenerateQuestionsContext {
  topicId:      string;
  topicName:    string;
  grade:        Grade;
  difficulty:   Difficulty;
  mode:         PracticeMode;
  questionCount: number;

  /** Enriched student context for personalisation */
  studentContext?: {
    learningPace:              string;  // "slow" | "standard" | "fast"
    confidenceLevel:           number;  // 0–100
    preferredExplanationStyle: string;  // "visual" | "step_by_step" | "story" | "analogy" | "direct"
    recentMistakes?:           string[];
    interestKeywords?:         string[];
    // From full memory snapshot (when available)
    activeMisconceptionsForTopic?: string[];  // mistake tags specific to this topic
    weakTopicNames?:           string[];  // to shape difficulty weighting
  };
}

/** Shape we expect back from the AI model */
export interface AIGeneratedQuestion {
  id:           string;
  type:         "fill_in_blank" | "multiple_choice" | "true_false";
  prompt:       string;
  options?:     string[];          // only for multiple_choice — exactly 4 items
  correctAnswer: string;
  difficulty:   Difficulty;
  xpReward:     number;            // 10–30
  conceptTags:  string[];
  aiGenerated:  true;              // flag so services can tell origin
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MathAI, an expert curriculum designer for primary and middle school mathematics.
Your job is to generate high-quality, engaging, grade-appropriate math practice questions.

Tone: child-friendly, encouraging, fun. Use real-world scenarios kids can relate to (sports, food, animals, space, games).
Language: clear, simple English appropriate for the grade level.
Correctness: every question must have exactly one unambiguous correct answer.
Variety: mix question types and problem styles within a set.`;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(ctx: GenerateQuestionsContext): string {
  const { topicName, grade, difficulty, mode, questionCount, studentContext } = ctx;

  const gradeNum = grade.replace("G", "");
  const difficultyHint = {
    beginner:     "straightforward, single-step, small numbers",
    intermediate: "multi-step, some reasoning required",
    advanced:     "multi-step with explanation needed, some abstract thinking",
    challenge:    "complex, multi-step, puzzle-style, above grade level",
  }[difficulty] ?? "intermediate";

  const modeHint = {
    topic_practice:     "standard practice on this topic",
    guided:             "guided, with clear scaffolding in each question",
    review:             "recall and review — simpler versions of past questions",
    daily_challenge:    "challenging and fun — like a mini quiz",
    weak_area_booster:  "focused on common mistakes — help them understand the concept deeply",
  }[mode] ?? "standard practice";

  const personalisation = studentContext
    ? `\nStudent profile:
- Learning pace: ${studentContext.learningPace}
- Confidence: ${studentContext.confidenceLevel}/100 (${studentContext.confidenceLevel < 40 ? "needs encouragement and simpler entry questions" : studentContext.confidenceLevel > 70 ? "ready for a bit of a stretch" : "on track"})
- Prefers: ${studentContext.preferredExplanationStyle} style
${studentContext.activeMisconceptionsForTopic?.length ? `- KNOWN MISCONCEPTIONS on this topic: ${studentContext.activeMisconceptionsForTopic.join(", ")} — target these with questions that expose and correct the error` : ""}
${studentContext.recentMistakes?.length ? `- Recently struggled with (general): ${studentContext.recentMistakes.join(", ")} — vary question framing to build confidence` : ""}
${studentContext.interestKeywords?.length ? `- Interests: ${studentContext.interestKeywords.join(", ")} — use these in word problems where natural` : ""}`
    : "";

  return `Generate exactly ${questionCount} math practice questions.

Topic: ${topicName}
Grade: ${gradeNum} (${grade})
Difficulty profile: ${difficultyHint}
Session mode: ${modeHint}${personalisation}

RULES:
- Mix question types: at least 1 fill_in_blank, at least 1 multiple_choice (if count ≥ 3)
- multiple_choice MUST have exactly 4 options array with clearly distinct choices
- true_false only for definitional or conceptual statements
- xpReward: 10 for beginner, 15 for intermediate, 20 for advanced, 30 for challenge
- conceptTags: 1–3 tags describing the math concept (e.g. ["fraction-addition", "fraction"])
- Each question id: "q-" followed by a short random alphanumeric string (8 chars)
- DO NOT repeat the same problem with just different numbers
- Make word problems fun and contextual — avoid sterile abstract problems

Return ONLY a valid JSON array — no commentary, no markdown fences:
[
  {
    "id": "q-xxxxxxxx",
    "type": "fill_in_blank",
    "prompt": "If you have 3/8 of a pizza and eat 1/8 more, how much pizza have you eaten in total?",
    "correctAnswer": "4/8",
    "difficulty": "${difficulty}",
    "xpReward": 15,
    "conceptTags": ["fraction-addition", "fraction"],
    "aiGenerated": true
  },
  {
    "id": "q-yyyyyyyy",
    "type": "multiple_choice",
    "prompt": "What is 24 ÷ 6?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": "4",
    "difficulty": "${difficulty}",
    "xpReward": 15,
    "conceptTags": ["division"],
    "aiGenerated": true
  }
]`;
}

// ─── Generator ────────────────────────────────────────────────────────────────

export const questionGeneratorService = {
  /**
   * Generates practice questions via Vercel AI Gateway.
   * Returns an array of AIGeneratedQuestion ready to use in a practice session.
   *
   * Throws on AI failure — caller (practiceService) should catch and fall back
   * to the static curriculum generator.
   */
  async generate(ctx: GenerateQuestionsContext): Promise<AIGeneratedQuestion[]> {
    const prompt = buildPrompt(ctx);

    const questions = await callAIModelJSON<AIGeneratedQuestion[]>(prompt, {
      system:    SYSTEM_PROMPT,
      maxTokens: 2000,
      temperature: 0.7,  // some creativity for varied questions
      callSite:  "question_generator.generate",
    });

    // Validate and sanitise the response
    if (!Array.isArray(questions)) {
      throw new Error("AI returned non-array for questions");
    }

    return questions
      .filter((q) => q && typeof q.id === "string" && typeof q.prompt === "string")
      .map((q, i) => ({
        id:            q.id ?? `q-fallback-${i}`,
        type:          q.type ?? "fill_in_blank",
        prompt:        q.prompt,
        options:       q.type === "multiple_choice" ? (q.options ?? []) : undefined,
        correctAnswer: q.correctAnswer ?? "",
        difficulty:    q.difficulty ?? ctx.difficulty,
        xpReward:      typeof q.xpReward === "number" ? Math.max(5, Math.min(50, q.xpReward)) : 15,
        conceptTags:   Array.isArray(q.conceptTags) ? q.conceptTags : [ctx.topicId],
        aiGenerated:   true as const,
      }));
  },
};
