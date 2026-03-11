/**
 * @module ai/services/recommendationService
 *
 * AI-first personalised practice recommendations.
 *
 * Takes the student's progress data and profile, and returns an AI-curated
 * list of topic recommendations — with personalised reasons written by Claude.
 *
 * This AUGMENTS (not replaces) the algorithmic practiceMenuService:
 *   1. Algorithmic service builds the raw menu (sections, items, mastery scores)
 *   2. This service passes the top candidates + student context to the AI
 *   3. AI returns prioritised recommendations with human-readable reasons
 *   4. The enriched items replace the generic algorithmic reasons
 *
 * Route: GET /practice/menu  (called by practiceMenuService)
 *
 * Fallback: if AI fails, the algorithmic menu is returned unchanged.
 */

import { callAIModelJSON } from "../ai_client";
import type { MemorySnapshot } from "./studentMemoryService";
import type { Grade, MasteryLevel, PracticeMode } from "@mathai/shared-types";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface RecommendationCandidate {
  topicId:      string;
  topicName:    string;
  masteryLevel: MasteryLevel;
  accuracyPct:  number;            // 0–100
  daysSinceLastPractice: number;   // 9999 = never practiced
  sectionHint:  string;            // e.g. "best_for_you", "revise_this"
}

export interface StudentRecommendationContext {
  grade:                     Grade;
  learningPace:              string;
  confidenceLevel:           number;
  preferredExplanationStyle: string;
  recentStreak:              number;
  totalXP:                   number;
}

export interface AIRecommendation {
  topicId:       string;
  reason:        string;   // 1–2 sentence personalised reason
  priority:      number;   // 1 = highest priority
  suggestedMode: PracticeMode;
  encouragement: string;   // Short motivational line for the student
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MathAI's personalised learning advisor.
Your job is to recommend which math topics a student should practice next,
and explain WHY in a warm, encouraging, child-friendly way.
Be specific about what the student's data shows. Keep reasons concise (1–2 sentences).
Always sound positive and motivating — never make the student feel bad about struggles.`;

// ─── Service ──────────────────────────────────────────────────────────────────

export const recommendationService = {
  /**
   * Enriches a list of topic candidates with AI-generated personalised reasons.
   * Returns recommendations sorted by AI priority.
   *
   * @param candidates  - top candidates from the algorithmic service
   * @param student     - student context for personalisation
   * @returns           - AI-enriched recommendations in priority order
   */
  async enrich(
    candidates: RecommendationCandidate[],
    student: StudentRecommendationContext,
    memory?: MemorySnapshot
  ): Promise<AIRecommendation[]> {
    if (candidates.length === 0) return [];

    const gradeNum = student.grade.replace("G", "");

    // Build memory context block from the full snapshot when available
    const memoryBlock = memory && (memory.activeMistakePatterns.length > 0 || memory.weakTopics.length > 0)
      ? `\nDetailed student learning history:
${memory.activeMistakePatterns.length > 0 ? `- Active misconceptions: ${memory.activeMistakePatterns.slice(0, 5).map((p) => `${p.topicName}:${p.tag}(×${p.count})`).join(", ")}` : ""}
${memory.weakTopics.length > 0 ? `- Weak areas: ${memory.weakTopics.slice(0, 4).map((t) => `${t.topicName}(${Math.round(t.masteryScore * 100)}%)`).join(", ")}` : ""}
${memory.strongTopics.length > 0 ? `- Strong areas: ${memory.strongTopics.slice(0, 3).map((t) => t.topicName).join(", ")}` : ""}
${memory.confidenceTrend !== "stable" ? `- Confidence trend: ${memory.confidenceTrend}` : ""}
${memory.interests.length > 0 ? `- Interests: ${memory.interests.join(", ")}` : ""}`
      : "";

    const prompt = `You are helping a Grade ${gradeNum} student decide what to practice next.

Student profile:
- Learning pace: ${student.learningPace}
- Confidence level: ${student.confidenceLevel}/100
- Current streak: ${student.recentStreak} days
- Total XP earned: ${student.totalXP}
- Preferred style: ${student.preferredExplanationStyle}${memoryBlock}

Here are their top topic candidates with progress data:
${candidates.map((c, i) => `
${i + 1}. ${c.topicName} (topicId: "${c.topicId}")
   - Mastery: ${c.masteryLevel.replace("_", " ")}
   - Accuracy: ${c.accuracyPct}%
   - Last practiced: ${c.daysSinceLastPractice >= 9999 ? "never" : `${c.daysSinceLastPractice} days ago`}
   - Section: ${c.sectionHint.replace("_", " ")}
`).join("")}

For each topic, provide a personalised recommendation that references the student's SPECIFIC history.
Return ONLY a valid JSON array:
[
  {
    "topicId": "...",
    "reason": "1-2 sentences explaining why this topic is recommended for this specific student right now",
    "priority": 1,
    "suggestedMode": "guided|topic_practice|daily_challenge|weak_area_booster|review",
    "encouragement": "A short, fun motivational line (max 10 words)"
  }
]

Rank by priority (1 = most important to practice now). Consider: low mastery, active misconceptions, time since last practice, and the student's confidence trend.`;

    const recommendations = await callAIModelJSON<AIRecommendation[]>(prompt, {
      system:      SYSTEM_PROMPT,
      maxTokens:   1200,
      temperature: 0.6,
      callSite:    "recommendation.enrich",
    });

    if (!Array.isArray(recommendations)) return [];

    // Validate and return sorted by priority
    return recommendations
      .filter((r) => r && typeof r.topicId === "string" && typeof r.reason === "string")
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  },

  /**
   * Generates an AI-powered "what to study next" summary for the dashboard.
   * Returns 1–3 topic suggestions with short reasons, for the dashboard card.
   */
  async suggestNext(
    progressSnapshot: { topicId: string; topicName: string; masteryLevel: MasteryLevel; accuracyPct: number }[],
    student: Pick<StudentRecommendationContext, "grade" | "confidenceLevel">
  ): Promise<{ topicId: string; topicName: string; reason: string }[]> {
    if (progressSnapshot.length === 0) return [];

    const gradeNum = student.grade.replace("G", "");
    const candidates = progressSnapshot
      .filter((t) => t.masteryLevel !== "extended")
      .slice(0, 6);  // limit context size

    if (candidates.length === 0) return [];

    const prompt = `A Grade ${gradeNum} student (confidence: ${student.confidenceLevel}/100) has the following topic progress:
${candidates.map((t) => `- ${t.topicName}: ${t.masteryLevel}, ${t.accuracyPct}% accuracy`).join("\n")}

Suggest the 3 best topics to study next. Return ONLY a JSON array:
[{"topicId":"...","topicName":"...","reason":"1 short sentence max"}]`;

    try {
      const result = await callAIModelJSON<{ topicId: string; topicName: string; reason: string }[]>(prompt, {
        system:      SYSTEM_PROMPT,
        maxTokens:   400,
        temperature: 0.5,
        callSite:    "recommendation.suggestNext",
      });
      return Array.isArray(result) ? result.slice(0, 3) : [];
    } catch {
      return [];
    }
  },
};
