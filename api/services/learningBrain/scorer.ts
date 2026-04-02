/**
 * @module api/services/learningBrain/scorer
 *
 * Pure scoring and decision logic for the Learning Brain Engine.
 * No DB access, no side effects — takes extracted signals, returns a decision.
 *
 * ─── PRIORITY FRAMEWORK ─────────────────────────────────────────────────────
 *
 *   1. Severe misconception / repeated failure    (score ≥ 100)
 *   2. Confidence recovery needed                 (score ≥ 80)
 *   3. Revision due on neglected topic            (score ≥ 60)
 *   4. Curriculum progression opportunity         (score ≥ 40)
 *   5. Healthy challenge for strong students      (score ≥ 20)
 *
 * Within each priority band, topics are ranked by a weighted composite score.
 * The engine prefers meaningful trends over noisy single events.
 *
 * ─── BALANCE RULES ──────────────────────────────────────────────────────────
 *
 *   - Never drill weak areas endlessly (cap consecutive remediation)
 *   - Inject revision and confidence boosts regularly
 *   - Recognise improvement with encouragement and progression
 *   - Never punish slow-but-accurate students
 */

import type { TopicSignal, StudentSignals, ExtractedSignals } from "./signals";
import type {
  LearningNextAction,
  LearningActionType,
  BrainDifficulty,
  SessionMode,
  ExplanationPreference,
  SourceSignals,
} from "@mathai/shared-types";

// ─── Scored candidate (internal) ─────────────────────────────────────────────

interface ScoredCandidate {
  topic:    TopicSignal;
  score:    number;
  type:     LearningActionType;
  signals:  SourceSignals;
}

// ─── Scoring constants (tunable) ─────────────────────────────────────────────
// These thresholds determine how the brain prioritises topics. They are intentionally
// tunable — adjust based on cohort data once analytics are available.

const SEVERE_MISCONCEPTION_THRESHOLD = 4;    // Mistake count on a single pattern to trigger top priority
const WEAK_MASTERY_CEILING           = 0.55; // Mastery score below this = weak (aligns with studentMemoryService weak threshold)
const STRONG_MASTERY_FLOOR           = 0.75; // Mastery score above this = strong (aligns with studentMemoryService strong threshold)
const REVISION_DUE_DAYS             = 5;     // Days since last practice to trigger revision suggestion
const LOW_CONFIDENCE_THRESHOLD       = 40;   // Avg confidence (0–100) below this = needs recovery
const HIGH_HINT_DEPENDENCY           = 1.2;  // Avg hints per question above this = dependent on hints

// Scoring weights — higher = stronger signal. Priority bands:
//   100+ = severe misconception (must address immediately)
//   60-99 = moderate priority (weak areas, revision due)
//   20-59 = standard priority (progression, challenge)
//   <20  = low priority (behavioral tweaks)

// ─── Score a single topic ────────────────────────────────────────────────────

function scoreTopic(topic: TopicSignal, student: StudentSignals): ScoredCandidate {
  let score = 0;
  const signals: SourceSignals = {};

  // ── Priority 1: Severe misconception / repeated failure ─────────────────
  if (topic.activeMisconceptions.length > 0 && topic.recentErrorCount >= SEVERE_MISCONCEPTION_THRESHOLD) {
    score += 120;
    signals.recentErrors = true;
    signals.weakArea = true;
  } else if (topic.activeMisconceptions.length > 0 && topic.recentErrorCount >= 2) {
    score += 80;
    signals.recentErrors = true;
  }

  // ── Priority 2: Weak area needing attention ─────────────────────────────
  if (topic.isWeak) {
    score += 50 + (1 - topic.masteryScore) * 30; // weaker = higher score
    signals.weakArea = true;
  }

  // ── Priority 3: Low confidence on this topic ────────────────────────────
  if (student.avgConfidence < LOW_CONFIDENCE_THRESHOLD && topic.isWeak) {
    score += 30;
    signals.lowConfidence = true;
  }

  // ── Priority 4: Hint dependency ─────────────────────────────────────────
  if (topic.hintDependency >= HIGH_HINT_DEPENDENCY) {
    score += 20;
    signals.hintDependency = true;
  }

  // ── Priority 5: Revision due (not practiced recently) ───────────────────
  if (topic.daysSinceLastPractice >= REVISION_DUE_DAYS && topic.masteryScore > 0) {
    const staleness = Math.min(topic.daysSinceLastPractice / 30, 1); // 0–1, capped at 30 days
    score += 40 + staleness * 20;
    signals.revisionDue = true;
    signals.neglectedTopic = topic.daysSinceLastPractice >= 14;
  }

  // ── Priority 6: Ready for mastery upgrade ───────────────────────────────
  if (topic.masteryScore >= 0.6 && topic.masteryScore < STRONG_MASTERY_FLOOR && topic.isImproving) {
    score += 35;
    signals.masteryReady = true;
  }

  // ── Priority 7: Behavioral patterns ─────────────────────────────────────
  if (student.fastButInaccurate && topic.accuracyRate < 60) {
    score += 15;
    signals.fastButInaccurate = true;
  }
  if (student.slowButAccurate && topic.isStrong) {
    // Don't penalise — small boost toward challenge
    score += 10;
    signals.slowButAccurate = true;
  }

  // ── Determine action type ───────────────────────────────────────────────
  let type: LearningActionType = "practice";

  if (signals.recentErrors && topic.activeMisconceptions.length > 0) {
    type = "review_mistake";
  } else if (signals.revisionDue && !signals.weakArea) {
    type = "revise";
  } else if (signals.masteryReady && topic.isImproving) {
    type = "continue_path";
  } else if (topic.isStrong && !signals.revisionDue) {
    type = "challenge";
    score += 15; // Give strong topics a base score for challenge rotation
  } else if (topic.isNewTopic) {
    type = "continue_path";
    score += 25; // New unlocked topics deserve attention for curriculum progression
  }

  return { topic, score, type, signals };
}

// ─── Determine difficulty ────────────────────────────────────────────────────

function decideDifficulty(
  candidate: ScoredCandidate,
  student: StudentSignals,
): BrainDifficulty {
  const { topic, type, signals } = candidate;

  if (type === "review_mistake" || signals.lowConfidence) return "easy";
  if (type === "challenge") return "hard";
  if (signals.fastButInaccurate) return "easy"; // slow them down with easier but more deliberate questions

  if (topic.masteryScore >= STRONG_MASTERY_FLOOR) return "hard";
  if (topic.masteryScore >= 0.5) return "medium";
  if (topic.masteryScore >= 0.25) return "easy";

  // New / very low mastery — adaptive lets the session engine decide
  return "adaptive";
}

// ─── Determine session mode ──────────────────────────────────────────────────

function decideSessionMode(candidate: ScoredCandidate, student: StudentSignals): SessionMode {
  const { type, signals } = candidate;

  if (type === "review_mistake") return "guided";
  if (type === "revise") return "revision";
  if (type === "challenge") return "challenge";
  if (signals.hintDependency || signals.lowConfidence) return "guided";
  if (signals.fastButInaccurate) return "guided"; // force more thoughtful engagement

  return "focus";
}

// ─── Determine explanation preference ────────────────────────────────────────

function decideExplanationPreference(
  candidate: ScoredCandidate,
  student: StudentSignals,
): ExplanationPreference {
  const { topic, signals } = candidate;

  // If student has a clear preference and it's working, respect it
  if (student.explanationStyle === "visual" && !signals.hintDependency) return "visual";
  if (student.explanationStyle === "step_by_step") return "step_by_step";

  // Misconception-heavy or hint-dependent → step-by-step to build understanding
  if (signals.recentErrors || signals.hintDependency) return "step_by_step";

  // Visual-friendly topics (fractions, number lines, place value, arrays)
  const visualTopicPatterns = ["fraction", "number-line", "place-value", "array", "bar-model", "geometry"];
  const isVisualTopic = visualTopicPatterns.some((p) => topic.topicId.toLowerCase().includes(p));
  if (isVisualTopic && topic.masteryScore < 0.6) return "visual";

  // Confident, high-performing student → keep it concise
  if (student.avgConfidence >= 70 && topic.masteryScore >= 0.6) return "concise";

  return "adaptive";
}

// ─── Determine question count ────────────────────────────────────────────────

function decideQuestionCount(
  candidate: ScoredCandidate,
  student: StudentSignals,
): number {
  const { type, signals } = candidate;

  if (type === "review_mistake") return 3; // Short focused session
  if (signals.fastButInaccurate) return 4; // Shorter but deliberate
  if (type === "revise") return 4;
  if (type === "challenge") return 5;
  if (student.learningPace === "slow") return 4;
  if (student.learningPace === "fast") return 6;
  return 5; // standard
}

// ─── Generate reason (human-readable, caring tone) ───────────────────────────

function generateReason(candidate: ScoredCandidate, student: StudentSignals): string {
  const { topic, type, signals } = candidate;
  const name = topic.topicName;

  if (type === "review_mistake" && signals.recentErrors) {
    const misconception = topic.activeMisconceptions[0];
    if (misconception) {
      return `You've been tripping up on ${misconception.replace(/-/g, " ")} in ${name}. Let's work through it together so it clicks.`;
    }
    return `${name} has been tricky lately. A short focused session will help clear things up.`;
  }

  if (signals.lowConfidence && signals.weakArea) {
    return `Your confidence on ${name} is building — a few gentle practice questions will help you feel stronger.`;
  }

  if (signals.hintDependency) {
    return `You've been using hints a lot on ${name}. Let's try a guided session to build more independence.`;
  }

  if (signals.fastButInaccurate) {
    return `You're moving fast on ${name}, but some answers are slipping. Let's slow down and really nail it.`;
  }

  if (type === "revise" && signals.neglectedTopic) {
    return `It's been a while since you practised ${name}. A quick revision will keep it fresh in your memory.`;
  }

  if (type === "revise") {
    return `Time for a revision of ${name} — let's make sure it stays strong.`;
  }

  if (type === "continue_path" && signals.masteryReady) {
    return `You're making real progress on ${name}! Keep going and you'll master it soon.`;
  }

  if (type === "continue_path" && topic.isNewTopic) {
    return `${name} is ready for you to explore. Let's start your first session!`;
  }

  if (type === "challenge") {
    return `You've got ${name} down well. Ready to push yourself with a challenge?`;
  }

  if (signals.slowButAccurate) {
    return `You're doing great on ${name} — accurate and thoughtful. Let's keep that momentum going.`;
  }

  return `${name} is a good fit for you right now. Let's make some progress!`;
}

// ─── Generate encouragement (short, motivational) ────────────────────────────

const ENCOURAGEMENT_POOL: Record<LearningActionType, string[]> = {
  review_mistake: [
    "Mistakes are how we learn — you've got this!",
    "Every expert was once a beginner. Let's grow!",
    "This is exactly how real learning happens.",
  ],
  practice: [
    "One step at a time — you're building something great!",
    "Every question makes you stronger.",
    "You're doing amazing — keep it up!",
  ],
  revise: [
    "Revision is the secret weapon of great learners!",
    "Keeping skills fresh is a smart move.",
    "Quick revision, lasting knowledge!",
  ],
  continue_path: [
    "You're on a roll — don't stop now!",
    "Your progress is really showing!",
    "Onwards and upwards!",
  ],
  challenge: [
    "Time to show what you're made of!",
    "Challenge accepted — let's go!",
    "You're ready for this!",
  ],
};

function generateEncouragement(type: LearningActionType): string {
  const pool = ENCOURAGEMENT_POOL[type];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

// ─── Main scoring function ───────────────────────────────────────────────────

/**
 * Score all topic signals and return the single best next action.
 *
 * Returns null only if there are zero topics to recommend (brand-new student
 * with nothing unlocked yet).
 */
export function decideLearningAction(
  signals: ExtractedSignals,
): LearningNextAction | null {
  const { topics, student } = signals;

  if (topics.length === 0) return null;

  // Score every topic
  const candidates = topics.map((t) => scoreTopic(t, student));

  // Sort by score descending — highest priority first
  candidates.sort((a, b) => b.score - a.score);

  // ── Balance rule: don't pick a challenge if student has severe misconceptions
  // unless no other options exist
  let best = candidates[0]!;
  if (best.type === "challenge" && student.hasSevereMisconception && candidates.length > 1) {
    const nonChallenge = candidates.find((c) => c.type !== "challenge");
    if (nonChallenge) best = nonChallenge;
  }

  // ── Balance rule: if the top candidate is remediation-heavy and
  // confidence is very low, ensure difficulty is easy
  const difficulty = decideDifficulty(best, student);
  const sessionMode = decideSessionMode(best, student);
  const explanationPreference = decideExplanationPreference(best, student);
  const questionCount = decideQuestionCount(best, student);
  const reason = generateReason(best, student);
  const encouragement = generateEncouragement(best.type);

  // Confidence target: where we'd like the student to be after this session
  let confidenceTarget: number | undefined;
  if (student.avgConfidence < 50) {
    confidenceTarget = Math.min(student.avgConfidence + 15, 70);
  } else if (best.type === "challenge") {
    confidenceTarget = Math.min(student.avgConfidence + 5, 90);
  }

  return {
    type:                     best.type,
    topicId:                  best.topic.topicId,
    topicName:                best.topic.topicName,
    difficulty,
    reason,
    encouragement,
    confidenceTarget,
    sessionMode,
    recommendedQuestionCount: questionCount,
    explanationPreference,
    sourceSignals:            best.signals,
  };
}
