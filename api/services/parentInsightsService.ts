/**
 * @module api/services/parentInsightsService
 *
 * Transforms raw student learning data into parent-friendly insights.
 *
 * This is the intelligence layer between the raw analytics and the parent portal.
 * It never dumps raw metrics — it produces readable, actionable, non-judgmental
 * summaries that help parents understand their child's learning journey.
 *
 * ─── INSIGHT GENERATION RULES ────────────────────────────────────────────────
 *
 *   - Short (1-2 sentences max)
 *   - Helpful and actionable
 *   - Non-judgmental — never punitive
 *   - Grounded in real data — no speculation
 *   - Parent-friendly language — no education jargon
 */

import type { MemorySnapshot } from "../../ai/services/studentMemoryService";
import { daysSince }           from "../lib/dateUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConfidenceSignal = "rising" | "stable" | "needs_support";
export type SupportNeedLevel = "low" | "moderate" | "high";
export type LearningStatus = "excellent" | "on_track" | "needs_attention";

export interface LearningScore {
  overall:     number;   // 0–100 composite score
  mastery:     number;   // 0–100 mastery component
  consistency: number;   // 0–100 consistency component
  effort:      number;   // 0–100 effort component
  accuracy:    number;   // 0–100 accuracy component
  improvement: number;   // 0–100 improvement component
}

export interface ParentInsight {
  id:          string;
  type:        "strength" | "improvement" | "attention" | "suggestion" | "celebration";
  icon:        string;
  message:     string;
  actionHint?: string;   // simple, actionable suggestion for the parent
  priority:    number;   // 1 = highest
}

/** Learning personality trait derived from behavioral data */
export interface LearningPersonalityTrait {
  icon:    string;
  label:   string;
  detail:  string;
}

/** Mastery topics grouped by cluster */
export interface MasteryClusters {
  weakAreas:      TopicMasteryItem[];
  improving:      TopicMasteryItem[];
  strong:         TopicMasteryItem[];
  revisionDue:    TopicMasteryItem[];
  notStarted:     number;
}

export interface TopicMasteryItem {
  topicId:    string;
  topicName:  string;
  status:     "not_started" | "learning" | "struggling" | "improving" | "mastered" | "needs_revision";
  masteryPct: number;   // 0–100
  accuracyPct: number;
  daysSinceLastPractice: number;
}

export interface RecentHighlight {
  type:    "mastered_topic" | "improved" | "streak" | "struggled" | "difficulty_up" | "badge_earned";
  icon:    string;
  message: string;
  date:    string;
}

export interface ParentDashboardData {
  childName:              string;
  childGrade:             string;
  learningScore:          LearningScore;
  learningStatus:         LearningStatus;
  confidenceSignal:       ConfidenceSignal;
  confidenceExplanation:  string;
  supportNeed:            SupportNeedLevel;
  currentFocus:           { topicName: string; reason: string } | null;
  todayActivity:          { questionsAnswered: number; minutesActive: number; sessionsCompleted: number };
  streak:                 { current: number; longest: number };
  insights:               ParentInsight[];
  insightBasis:           string;
  learningPersonality:    LearningPersonalityTrait[];
  masteryClusters:        MasteryClusters;
  masteryMap:             TopicMasteryItem[];
  recentHighlights:       RecentHighlight[];
  nextRecommendation:     { topicName: string; reason: string; actionType: string } | null;
}

// ─── Input data shapes (from existing services) ──────────────────────────────

export interface TopicProgressInput {
  topicId:          string;
  masteryScore:     number;
  accuracyRate:     number;
  completionPercent: number;
  isMastered:       boolean;
  lastPracticedAt:  Date | null;
}

export interface StudentDataInput {
  userId:          string;
  name:            string;
  grade:           string;
  profile: {
    totalXp:                  number;
    currentLevel:             number;
    confidenceLevel:          number;
    learningPace:             string;
    totalHintsUsed:           number;
    totalQuestionsAttempted:  number;
    avgConfidenceScore:       number;
  };
  streak: {
    currentStreak:  number;
    longestStreak:  number;
  };
  topicProgress:   TopicProgressInput[];
  memorySnapshot?: MemorySnapshot;
  recentBadges:    Array<{ name: string; earnedAt: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function topicNameFromId(id: string): string {
  return id.replace(/^g\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Learning Score ──────────────────────────────────────────────────────────

/**
 * Compute a composite learning score from student data.
 *
 * Components (each 0–100):
 *   - Mastery (30%): avg mastery across attempted topics
 *   - Consistency (20%): streak + regular practice signals
 *   - Effort (15%): total questions attempted + sessions completed
 *   - Accuracy (20%): avg accuracy across topics
 *   - Improvement (15%): confidence trend + improving topics
 */
export function computeLearningScore(data: StudentDataInput): LearningScore {
  const attempted = data.topicProgress.filter((t) => t.completionPercent > 0);

  // Mastery: avg mastery score * 100
  const mastery = attempted.length > 0
    ? Math.round((attempted.reduce((s, t) => s + t.masteryScore, 0) / attempted.length) * 100)
    : 0;

  // Consistency: streak contribution (max 100 at 14 days)
  const streakScore = clamp(Math.round((data.streak.currentStreak / 14) * 100), 0, 100);
  const consistency = streakScore;

  // Effort: questions attempted (max 100 at 200 questions)
  const effort = clamp(Math.round((data.profile.totalQuestionsAttempted / 200) * 100), 0, 100);

  // Accuracy: avg accuracy across attempted topics
  const accuracy = attempted.length > 0
    ? Math.round((attempted.reduce((s, t) => s + t.accuracyRate, 0) / attempted.length) * 100)
    : 0;

  // Improvement: based on confidence trend
  const confTrend = data.memorySnapshot?.confidenceTrend;
  const improvement = confTrend === "rising" ? 85
    : confTrend === "stable" ? 60
    : confTrend === "falling" ? 30
    : 50;

  const overall = Math.round(
    mastery * 0.30 +
    consistency * 0.20 +
    effort * 0.15 +
    accuracy * 0.20 +
    improvement * 0.15
  );

  return { overall, mastery, consistency, effort, accuracy, improvement };
}

// ─── Confidence Signal ───────────────────────────────────────────────────────

export function computeConfidenceSignal(data: StudentDataInput): ConfidenceSignal {
  const trend = data.memorySnapshot?.confidenceTrend;
  const avgConf = data.profile.avgConfidenceScore;

  if (trend === "rising" || avgConf >= 65) return "rising";
  if (trend === "falling" || avgConf < 35) return "needs_support";
  return "stable";
}

// ─── Support Need ────────────────────────────────────────────────────────────

export function computeSupportNeed(data: StudentDataInput): SupportNeedLevel {
  const weakTopics = data.memorySnapshot?.weakTopics ?? [];
  const misconceptions = data.memorySnapshot?.activeMistakePatterns ?? [];
  const avgConf = data.profile.avgConfidenceScore;
  const hintRate = data.profile.totalQuestionsAttempted > 0
    ? data.profile.totalHintsUsed / data.profile.totalQuestionsAttempted
    : 0;

  let score = 0;
  if (weakTopics.length >= 3) score += 2;
  else if (weakTopics.length >= 1) score += 1;

  if (misconceptions.length >= 3) score += 2;
  else if (misconceptions.length >= 1) score += 1;

  if (avgConf < 35) score += 2;
  else if (avgConf < 50) score += 1;

  if (hintRate > 1.0) score += 1;

  if (score >= 5) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

// ─── Learning Status ─────────────────────────────────────────────────────────

export function computeLearningStatus(score: LearningScore): LearningStatus {
  if (score.overall >= 85) return "excellent";
  if (score.overall >= 60) return "on_track";
  return "needs_attention";
}

// ─── Confidence Explanation ──────────────────────────────────────────────────

export function computeConfidenceExplanation(data: StudentDataInput): string {
  const trend = data.memorySnapshot?.confidenceTrend;
  const snapshot = data.memorySnapshot;

  if (trend === "rising") {
    // Find an improving topic to credit
    const improving = data.topicProgress
      .filter((t) => t.masteryScore >= 0.5 && t.completionPercent > 0)
      .sort((a, b) => b.masteryScore - a.masteryScore);
    if (improving.length > 0) {
      return `Confidence is rising — improvement in ${topicNameFromId(improving[0]!.topicId)} is helping.`;
    }
    return "Confidence is rising with steady practice and progress.";
  }

  if (trend === "falling") {
    // Find the topic causing trouble
    const weak = snapshot?.weakTopics ?? [];
    if (weak.length > 0) {
      return `Confidence dipped — repeated challenges in ${weak[0]!.topicName} may be the cause.`;
    }
    return "Confidence has dipped recently. Regular encouragement at home helps.";
  }

  // stable
  if (data.streak.currentStreak >= 3) {
    return "Confidence is stable — consistent daily practice is keeping things steady.";
  }
  return "Confidence is holding steady at a healthy level.";
}

// ─── Learning Personality ────────────────────────────────────────────────────

/**
 * Derive learning personality traits from behavioral data.
 * Returns 2-4 traits that describe how the child learns.
 * All labels are positive/neutral — never negative.
 */
export function computeLearningPersonality(data: StudentDataInput): LearningPersonalityTrait[] {
  const traits: LearningPersonalityTrait[] = [];
  const snapshot = data.memorySnapshot;
  const hintRate = data.profile.totalQuestionsAttempted > 0
    ? data.profile.totalHintsUsed / data.profile.totalQuestionsAttempted
    : 0;

  // Visual learner: preferred style or high visual usage
  const style = snapshot?.preferredExplanationStyle ?? data.profile.learningPace;
  if (style === "visual") {
    traits.push({
      icon:   "🎨",
      label:  "Visual Learner",
      detail: "Learns best when concepts are shown with diagrams and pictures.",
    });
  } else if (style === "step_by_step") {
    traits.push({
      icon:   "📋",
      label:  "Step-by-Step Thinker",
      detail: "Prefers clear, ordered instructions and builds understanding methodically.",
    });
  }

  // Hint usage pattern
  if (hintRate > 1.0) {
    traits.push({
      icon:   "🤝",
      label:  "Support Seeker",
      detail: "Likes to check with hints before answering — builds confidence through guidance.",
    });
  } else if (hintRate < 0.2 && data.profile.totalQuestionsAttempted >= 20) {
    traits.push({
      icon:   "🦁",
      label:  "Independent Solver",
      detail: "Prefers to work through problems alone before asking for help.",
    });
  }

  // Speed pattern
  const pace = snapshot?.learningPace ?? data.profile.learningPace;
  if (pace === "fast") {
    traits.push({
      icon:   "⚡",
      label:  "Quick Thinker",
      detail: "Moves through problems fast — may benefit from pausing on tricky ones.",
    });
  } else if (pace === "slow") {
    traits.push({
      icon:   "🐢",
      label:  "Careful Thinker",
      detail: "Takes time to think through each problem — accuracy tends to be strong.",
    });
  }

  // Recovery pattern (from confidence trend + improving topics)
  const improvingCount = data.topicProgress.filter(
    (t) => t.masteryScore >= 0.5 && t.masteryScore < 0.8 && t.completionPercent > 0
  ).length;
  if (improvingCount >= 2) {
    traits.push({
      icon:   "💪",
      label:  "Resilient Learner",
      detail: "Shows steady improvement across multiple topics after initial challenges.",
    });
  }

  // Consistent practiser
  if (data.streak.currentStreak >= 7) {
    traits.push({
      icon:   "🔥",
      label:  "Consistent Practiser",
      detail: "Practices regularly — this habit is one of the strongest predictors of success.",
    });
  }

  return traits.slice(0, 4);
}

// ─── Mastery Clustering ──────────────────────────────────────────────────────

export function buildMasteryClusters(
  masteryMap: TopicMasteryItem[],
): MasteryClusters {
  return {
    weakAreas:   masteryMap.filter((t) => t.status === "struggling"),
    improving:   masteryMap.filter((t) => t.status === "improving" || t.status === "learning"),
    strong:      masteryMap.filter((t) => t.status === "mastered"),
    revisionDue: masteryMap.filter((t) => t.status === "needs_revision"),
    notStarted:  masteryMap.filter((t) => t.status === "not_started").length,
  };
}

// ─── Insight Basis ───────────────────────────────────────────────────────────

export function computeInsightBasis(data: StudentDataInput): string {
  const totalQ = data.profile.totalQuestionsAttempted;
  const sessions = data.memorySnapshot?.recentSessions?.length ?? 0;

  if (totalQ === 0) return "These insights will update as your child starts practising.";

  const parts: string[] = [];
  parts.push(`${totalQ} question${totalQ !== 1 ? "s" : ""} answered`);
  if (sessions > 0) parts.push(`${sessions} recent session${sessions !== 1 ? "s" : ""}`);
  if (data.streak.currentStreak > 0) parts.push(`${data.streak.currentStreak}-day streak`);

  return `Based on ${parts.join(", ")}.`;
}

// ─── Topic Mastery Map ───────────────────────────────────────────────────────

export function buildMasteryMap(
  data: StudentDataInput,
  topicNames: Map<string, string>,
): TopicMasteryItem[] {
  return data.topicProgress.map((t) => {
    const days = daysSince(t.lastPracticedAt);
    const name = topicNames.get(t.topicId) ?? topicNameFromId(t.topicId);

    let status: TopicMasteryItem["status"];
    if (t.completionPercent === 0)       status = "not_started";
    else if (t.isMastered && days > 14)  status = "needs_revision";
    else if (t.isMastered)               status = "mastered";
    else if (t.masteryScore < 0.4)       status = "struggling";
    else if (t.masteryScore >= 0.6)      status = "improving";
    else                                 status = "learning";

    return {
      topicId:               t.topicId,
      topicName:             name,
      status,
      masteryPct:            Math.round(t.masteryScore * 100),
      accuracyPct:           Math.round(t.accuracyRate * 100),
      daysSinceLastPractice: days === 9999 ? -1 : days,
    };
  });
}

// ─── Insight Generation ──────────────────────────────────────────────────────

/**
 * Generate parent-friendly insights from student data.
 * Each insight is short, helpful, non-judgmental, and data-grounded.
 * Returns max 6 insights, prioritized.
 */
export function generateInsights(data: StudentDataInput): ParentInsight[] {
  const insights: ParentInsight[] = [];
  const snapshot = data.memorySnapshot;
  let id = 0;

  // ── Strengths ───────────────────────────────────────────────────────────
  const strongTopics = snapshot?.strongTopics ?? [];
  if (strongTopics.length > 0) {
    const names = strongTopics.slice(0, 2).map((t) => t.topicName).join(" and ");
    insights.push({
      id:         `ins-${++id}`,
      type:       "strength",
      icon:       "💪",
      message:    `Your child is doing really well in ${names}. Great foundation!`,
      actionHint: `Celebrate this with them — recognition builds motivation.`,
      priority:   5,
    });
  }

  // ── Weak areas needing attention ────────────────────────────────────────
  const weakTopics = snapshot?.weakTopics ?? [];
  if (weakTopics.length > 0) {
    const weakName = weakTopics[0]!.topicName;
    insights.push({
      id:         `ins-${++id}`,
      type:       "attention",
      icon:       "📌",
      message:    `${weakName} still needs some support. MathAI is focusing practice here.`,
      actionHint: `Encourage 10 minutes of ${weakName.toLowerCase()} practice this week.`,
      priority:   2,
    });
  }

  // ── Misconception alert ─────────────────────────────────────────────────
  const misconceptions = snapshot?.activeMistakePatterns ?? [];
  if (misconceptions.length > 0) {
    const topMis = misconceptions[0]!;
    const tag = topMis.tag.replace(/-/g, " ");
    insights.push({
      id:         `ins-${++id}`,
      type:       "attention",
      icon:       "🎯",
      message:    `A recurring mix-up with ${tag} in ${topMis.topicName} — MathAI is targeting this with focused questions.`,
      actionHint: `Ask your child to explain ${tag} to you — teaching is a powerful way to learn.`,
      priority:   1,
    });
  }

  // ── Confidence trend ────────────────────────────────────────────────────
  const confTrend = snapshot?.confidenceTrend;
  if (confTrend === "rising") {
    insights.push({
      id:         `ins-${++id}`,
      type:       "celebration",
      icon:       "📈",
      message:    "Confidence is rising! Your child is feeling more sure of themselves.",
      actionHint: "Keep the positive momentum going with a quick \"well done\" at dinner.",
      priority:   4,
    });
  } else if (confTrend === "falling") {
    insights.push({
      id:         `ins-${++id}`,
      type:       "attention",
      icon:       "💛",
      message:    "Confidence has dipped recently. A little encouragement at home can make a big difference.",
      actionHint: "Try saying \"I noticed you're working hard on maths — that's impressive.\"",
      priority:   2,
    });
  }

  // ── Hint dependency ─────────────────────────────────────────────────────
  const hintRate = data.profile.totalQuestionsAttempted > 0
    ? data.profile.totalHintsUsed / data.profile.totalQuestionsAttempted
    : 0;
  if (hintRate > 1.0) {
    insights.push({
      id:         `ins-${++id}`,
      type:       "suggestion",
      icon:       "💡",
      message:    "Your child is relying on hints quite often. MathAI is gradually building their independence.",
      actionHint: "Encourage them to try answering before tapping the hint button.",
      priority:   3,
    });
  }

  // ── Revision due ────────────────────────────────────────────────────────
  const revisionDue = data.topicProgress.filter(
    (t) => t.isMastered && daysSince(t.lastPracticedAt) > 14
  );
  if (revisionDue.length > 0) {
    const topicName = topicNameFromId(revisionDue[0]!.topicId);
    insights.push({
      id:         `ins-${++id}`,
      type:       "suggestion",
      icon:       "🔄",
      message:    `${topicName} was mastered but hasn't been practised recently. A quick revision would help keep it fresh.`,
      actionHint: `Suggest a 5-minute ${topicName.toLowerCase()} refresher this weekend.`,
      priority:   3,
    });
  }

  // ── Consistency celebration ─────────────────────────────────────────────
  if (data.streak.currentStreak >= 5) {
    insights.push({
      id:         `ins-${++id}`,
      type:       "celebration",
      icon:       "🔥",
      message:    `${data.streak.currentStreak}-day practice streak! Consistency is key to learning.`,
      actionHint: "Streaks matter more than long sessions — keep the daily habit going.",
      priority:   5,
    });
  }

  // ── Improving topic ─────────────────────────────────────────────────────
  const improving = data.topicProgress.filter(
    (t) => t.masteryScore >= 0.5 && t.masteryScore < 0.8 && t.completionPercent > 0
  );
  if (improving.length > 0) {
    const name = topicNameFromId(improving[0]!.topicId);
    insights.push({
      id:         `ins-${++id}`,
      type:       "improvement",
      icon:       "🌱",
      message:    `${name} is coming along nicely — almost ready for mastery!`,
      actionHint: `A few more practice sessions on ${name.toLowerCase()} could push it to mastered.`,
      priority:   4,
    });
  }

  // Sort by priority (lowest number = highest priority) and take top 6
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 6);
}

// ─── Recent Highlights ───────────────────────────────────────────────────────

export function buildRecentHighlights(data: StudentDataInput): RecentHighlight[] {
  const highlights: RecentHighlight[] = [];

  // Mastered topics
  const mastered = data.topicProgress.filter((t) => t.isMastered && t.lastPracticedAt);
  for (const t of mastered.slice(0, 2)) {
    highlights.push({
      type:    "mastered_topic",
      icon:    "🏆",
      message: `Mastered ${topicNameFromId(t.topicId)}!`,
      date:    t.lastPracticedAt!.toISOString(),
    });
  }

  // Streak
  if (data.streak.currentStreak >= 3) {
    highlights.push({
      type:    "streak",
      icon:    "🔥",
      message: `${data.streak.currentStreak}-day practice streak`,
      date:    new Date().toISOString(),
    });
  }

  // Recent badges
  for (const badge of data.recentBadges.slice(0, 2)) {
    highlights.push({
      type:    "badge_earned",
      icon:    "🎖️",
      message: `Earned "${badge.name}"`,
      date:    badge.earnedAt,
    });
  }

  // Sort by date, most recent first
  highlights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return highlights.slice(0, 5);
}
