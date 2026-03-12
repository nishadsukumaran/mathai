/**
 * @module ai/tutor/tutor_service
 *
 * ORCHESTRATION LAYER — the single entry point for all MathAI tutoring.
 *
 * Pipeline for every help request:
 *
 *   TutorHelpRequest
 *       → Concept tag resolution   (topicId → conceptTags)
 *       → Misconception detection  (runs when studentAnswer is present)
 *       → Engine routing           (hint or explanation, based on helpMode)
 *       → Encouragement selection  (warm, child-friendly, context-aware)
 *       → TutorHelpResponse
 *
 * HELP MODE ROUTING:
 *   Hint1, Hint2, NextStep        → HintEngine
 *   ExplainFully, TeachConcept,
 *   SimilarExample                → ExplanationEngine
 *
 * This service is intentionally side-effect-free — no XP, no DB writes.
 * Business-level mutations live in api/services/practiceService.
 */

import {
  TutorHelpRequest,
  TutorHelpResponse,
  HelpMode,
} from "@/types";
import { HintEngine } from "./hint_engine";
import { ExplanationEngine } from "./explanation_engine";
import { MisconceptionEngine } from "./misconception_engine";
import type { MisconceptionResult } from "./misconception_engine";
import { callAIModel } from "../ai_client";

// ─── Concept Tag Map ──────────────────────────────────────────────────────────
// Maps topicId prefixes/keywords → concept tags used by hint + explanation engines

const TOPIC_TO_CONCEPT_TAGS: Array<{ match: RegExp; tags: string[] }> = [
  { match: /fraction.*add|add.*fraction/i,      tags: ["fraction-addition",    "fraction"] },
  { match: /fraction.*sub|sub.*fraction/i,      tags: ["fraction-subtraction", "fraction"] },
  { match: /fraction.*mult|mult.*fraction/i,    tags: ["fraction", "multiplication"] },
  { match: /fraction/i,                         tags: ["fraction"] },
  { match: /multipl/i,                          tags: ["multiplication"] },
  { match: /divis/i,                            tags: ["division"] },
  { match: /place.?val/i,                       tags: ["place-value"] },
  { match: /subtract/i,                         tags: ["subtraction"] },
  { match: /addition|add/i,                     tags: ["addition"] },
  { match: /decimal/i,                          tags: ["decimal", "place-value"] },
  { match: /geometry|shape|area|perimeter/i,    tags: ["geometry"] },
];

function resolveConceptTags(topicId: string, questionText: string): string[] {
  const combined = `${topicId} ${questionText}`;

  for (const entry of TOPIC_TO_CONCEPT_TAGS) {
    if (entry.match.test(combined)) return entry.tags;
  }

  return ["general"];
}

// ─── Encouragement Pools ──────────────────────────────────────────────────────

const ENCOURAGEMENT: Record<string, string[]> = {
  hint: [
    "You're on the right track — here's a little nudge!",
    "Great effort! Let me give you a clue.",
    "Almost there! Let's think about this together.",
    "You've got this! Here's something to think about.",
  ],
  hint_late: [
    "Still working through it — that's the spirit! Here's your next clue.",
    "No worries, this is tricky! Let me point you a bit further.",
    "Keep going! We'll crack this together.",
  ],
  explain: [
    "Let me walk you through this step by step!",
    "No worries — let's break it down together.",
    "Every math genius needed this explained once. Let's go!",
    "Here's exactly how to think about this problem.",
  ],
  teach: [
    "Great question — let me teach you the concept behind this!",
    "Understanding *why* this works makes it stick forever. Let's do that!",
    "Let's zoom out and understand the big picture first.",
  ],
  example: [
    "Let me show you a similar problem — worked all the way through!",
    "Here's another one just like it, so you can see the steps.",
    "Seeing it in action makes everything clearer. Check this out!",
  ],
};

function pickEncouragement(helpMode: HelpMode, hintsUsed: number): string {
  let pool: string[];

  switch (helpMode) {
    case HelpMode.Hint1:
    case HelpMode.Hint2:
      pool = hintsUsed >= 2 ? ENCOURAGEMENT["hint_late"]! : ENCOURAGEMENT["hint"]!;
      break;
    case HelpMode.NextStep:
      pool = ENCOURAGEMENT["hint_late"]!;
      break;
    case HelpMode.ExplainFully:
      pool = ENCOURAGEMENT["explain"]!;
      break;
    case HelpMode.TeachConcept:
      pool = ENCOURAGEMENT["teach"]!;
      break;
    case HelpMode.SimilarExample:
      pool = ENCOURAGEMENT["example"]!;
      break;
    default:
      pool = ENCOURAGEMENT["hint"]!;
  }

  return pool[Math.floor(Math.random() * pool.length)] ?? "You're doing great!";
}

// ─── AI Hint Generation ────────────────────────────────────────────────────────
// Generates a contextual, question-specific hint using the AI engine.
// Falls back to the template engine if the AI call fails.

const HINT_SYSTEM_PROMPT = `You are MathAI — a warm, patient math tutor for school students.
Your job is to give SHORT, targeted hints that help a student think through a specific problem.
Rules:
- Never give the final answer directly
- Keep your response to 1–2 sentences maximum
- Use simple, age-appropriate language
- Be encouraging and kind
- Focus on the specific problem the student is looking at`;

async function generateAIHint(params: {
  questionText:  string;
  grade:         string;
  hintLevel:     1 | 2 | 3;
  hintsUsed:     number;
  misconception: MisconceptionResult | null;
}): Promise<string> {
  const { questionText, grade, hintLevel, misconception } = params;

  const levelGuide =
    hintLevel === 1
      ? "Give a gentle nudge — remind them of the relevant concept or what to look at first. Do NOT show any method or calculation."
      : hintLevel === 2
        ? "Give a bigger clue — tell them what operation or approach to use, but stop before any calculation."
        : "Tell them the next step to take — be specific about what to do right now, but stop just before the final answer.";

  const misconceptionLine =
    misconception && misconception.confidence > 0.6
      ? `\nThe student may have this misconception: "${misconception.description}". Gently address it.`
      : "";

  const prompt = `A Grade ${grade} student is working on this math problem:
"${questionText}"

This is hint #${hintLevel}. ${levelGuide}${misconceptionLine}

Write your hint now (1–2 sentences only):`;

  return callAIModel(prompt, {
    system:    HINT_SYSTEM_PROMPT,
    maxTokens: 120,
    temperature: 0.6,
    callSite: "tutor_service.ai_hint",
  });
}

// ─── TutorService ─────────────────────────────────────────────────────────────

export class TutorService {
  private hintEngine:          HintEngine;
  private explanationEngine:   ExplanationEngine;
  private misconceptionEngine: MisconceptionEngine;

  constructor() {
    this.hintEngine          = new HintEngine();
    this.explanationEngine   = new ExplanationEngine();
    this.misconceptionEngine = new MisconceptionEngine();
  }

  /**
   * Main orchestration entry point — called by practiceService.getTutorHelp().
   *
   * Routes by helpMode:
   *   - Hint1 / Hint2 / NextStep   → hintEngine.generate()
   *   - ExplainFully / TeachConcept / SimilarExample → explanationEngine.generate()
   */
  async handleHelpRequest(request: TutorHelpRequest): Promise<TutorHelpResponse> {
    const {
      topicId,
      grade,
      questionText,
      studentAnswer,
      helpMode,
      hintsUsed,
    } = request;

    // ── Step 1: Resolve concept tags from topic + question text ────────────────
    const conceptTags = resolveConceptTags(topicId, questionText);

    // ── Step 2: Detect misconception when a wrong answer is available ──────────
    const misconception = studentAnswer
      ? this.misconceptionEngine.detect({
          questionText,
          studentAnswer,
          correctAnswer: "",   // correct answer not passed to tutor; engine degrades gracefully
          conceptTags,
        })
      : null;

    // ── Step 3: Route to the appropriate engine ────────────────────────────────
    const isHintMode = [
      HelpMode.Hint1,
      HelpMode.Hint2,
      HelpMode.NextStep,
    ].includes(helpMode);

    let content;
    let visualPlan;
    let similarExample;

    if (isHintMode) {
      // ── AI-first: generate a contextual hint from the actual question text ────
      const hintLevel: 1 | 2 | 3 =
        helpMode === HelpMode.Hint1 ? 1 : helpMode === HelpMode.Hint2 ? 2 : 3;

      let hintText: string | null = null;
      try {
        hintText = await generateAIHint({
          questionText,
          grade,
          hintLevel,
          hintsUsed,
          misconception,
        });
      } catch (aiErr) {
        console.warn("[tutor_service] AI hint failed — falling back to template:", (aiErr as Error).message);
      }

      if (hintText) {
        // AI succeeded — use its text directly
        content = { text: hintText };
        // Still get visual plan from template engine (no AI needed for diagrams)
        const templateResult = this.hintEngine.generate({
          topicId, conceptTags, questionText, studentAnswer,
          helpMode, hintsUsed, grade, misconception: misconception ?? undefined,
        });
        visualPlan = templateResult.visualPlan;
      } else {
        // AI failed — fall back fully to template engine
        const result = this.hintEngine.generate({
          topicId, conceptTags, questionText, studentAnswer,
          helpMode, hintsUsed, grade, misconception: misconception ?? undefined,
        });
        content    = result.content;
        visualPlan = result.visualPlan;
      }

    } else {
      const result = this.explanationEngine.generate({
        topicId,
        conceptTags,
        questionText,
        helpMode,
        grade,
      });

      content        = result.content;
      visualPlan     = result.visualPlan;
      similarExample = result.example;
    }

    // ── Step 4: Build and return the structured response ──────────────────────
    const response: TutorHelpResponse = {
      helpMode,
      encouragement:  pickEncouragement(helpMode, hintsUsed),
      content,
      ...(visualPlan     && { visualPlan }),
      ...(similarExample && { similarExample }),
    };

    return response;
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
export const tutorService = new TutorService();
