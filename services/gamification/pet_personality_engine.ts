/**
 * @module services/gamification/pet_personality_engine
 *
 * Core logic for pet personality detection, effects mapping, and evolution.
 *
 * DESIGN PRINCIPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *   • Personalities are cosmetic only — they NEVER affect learning logic.
 *   • Detection runs every PERSONALITY_EVAL_INTERVAL questions answered (50).
 *   • The dominant metric wins — ties broken by accuracy_rate.
 *   • Each personality has a base form and an evolved form (higher thresholds).
 *   • Effects are purely frontend hints: animation class, icon, aura color.
 *
 * PERSONALITIES & TRIGGER METRICS
 * ─────────────────────────────────────────────────────────────────────────────
 *   fast_thinker        → avgTimeSeconds is lowest, below SPEED_THRESHOLD
 *   problem_solver      → retrySuccessRate is highest (≥ 0.60)
 *   streak_champion     → streakLength ≥ 7 days and is dominant metric
 *   careful_learner     → accuracyRate ≥ 0.85 AND hintUsageRate ≤ 0.25
 *   persistent_explorer → questionsAnswered is highest relative score (high volume + retries)
 *   math_wizard         → conceptMasteryScore ≥ 0.75
 *
 * EVOLVED THRESHOLDS
 * ─────────────────────────────────────────────────────────────────────────────
 *   lightning_thinker   → fast_thinker AND avgTimeSeconds < EVOLVED_SPEED_THRESHOLD
 *   legendary_streak    → streak_champion AND streakLength ≥ 20
 *   grand_math_wizard   → math_wizard AND conceptMasteryScore ≥ 0.90
 *   master_solver       → problem_solver AND retrySuccessRate ≥ 0.85
 *   zen_learner         → careful_learner AND accuracyRate ≥ 0.95 AND hintUsageRate ≤ 0.10
 *   relentless_explorer → persistent_explorer AND questionsAnswered ≥ 500
 */

import {
  PetPersonality,
  PetBehaviorMetrics,
  PersonalityEffects,
} from "@/types";

// ─── Constants ─────────────────────────────────────────────────────────────────

/** How many questions must be answered before personality is re-evaluated. */
export const PERSONALITY_EVAL_INTERVAL = 50;

/** Average seconds below which a student is considered a "fast thinker". */
const SPEED_THRESHOLD         = 18;   // seconds
const EVOLVED_SPEED_THRESHOLD = 10;   // seconds

// ─── Pet Catalog ───────────────────────────────────────────────────────────────

export const PET_CATALOG = [
  {
    id:          "spark-owl",
    name:        "Spark Owl",
    emoji:       "🦉",
    description: "Wise and energetic — loves discovering new patterns in numbers.",
    rarity:      "common" as const,
    unlockLevel: 1,
  },
  {
    id:          "math-fox",
    name:        "Math Fox",
    emoji:       "🦊",
    description: "Quick and clever — always finds the fastest path to the answer.",
    rarity:      "common" as const,
    unlockLevel: 3,
  },
  {
    id:          "number-rabbit",
    name:        "Number Rabbit",
    emoji:       "🐰",
    description: "Speedy and curious — bounces through problems with endless energy.",
    rarity:      "common" as const,
    unlockLevel: 5,
  },
  {
    id:          "logic-dragon",
    name:        "Logic Dragon",
    emoji:       "🐲",
    description: "Powerful and persistent — never gives up on a difficult challenge.",
    rarity:      "rare" as const,
    unlockLevel: 6,
  },
  {
    id:          "fraction-panda",
    name:        "Fraction Panda",
    emoji:       "🐼",
    description: "Calm and careful — methodical in every step of the solution.",
    rarity:      "rare" as const,
    unlockLevel: 8,
  },
  {
    id:          "equation-wolf",
    name:        "Equation Wolf",
    emoji:       "🐺",
    description: "Sharp and mastery-driven — hunts down every concept until it's conquered.",
    rarity:      "legendary" as const,
    unlockLevel: 10,
  },
] as const;

export type PetCatalogId = (typeof PET_CATALOG)[number]["id"];

// ─── Personality Effects Map ───────────────────────────────────────────────────

/**
 * Visual and cosmetic effects for each personality.
 * These are the ONLY place personality influences the UI.
 * Frontend components read this map to apply animations, auras, icons.
 */
export const PERSONALITY_EFFECTS: Record<PetPersonality, PersonalityEffects> = {
  [PetPersonality.FastThinker]: {
    personality:     PetPersonality.FastThinker,
    label:           "Fast Thinker",
    description:     "Your pet loves speed! It zips through challenges and celebrates quick wins.",
    icon:            "⚡",
    animationClass:  "animate-bounce",
    auraColor:       "yellow",
    badgeColor:      "bg-yellow-100 text-yellow-800 border-yellow-200",
    isEvolved:       false,
  },
  [PetPersonality.ProblemSolver]: {
    personality:     PetPersonality.ProblemSolver,
    label:           "Problem Solver",
    description:     "Your pet never gives up! It celebrates every retry as progress.",
    icon:            "🔧",
    animationClass:  "animate-pulse",
    auraColor:       "orange",
    badgeColor:      "bg-orange-100 text-orange-800 border-orange-200",
    isEvolved:       false,
  },
  [PetPersonality.StreakChampion]: {
    personality:     PetPersonality.StreakChampion,
    label:           "Streak Champion",
    description:     "Your pet is on fire! It shows off a flame during active streaks.",
    icon:            "🔥",
    animationClass:  "animate-pulse",
    auraColor:       "red",
    badgeColor:      "bg-red-100 text-red-800 border-red-200",
    streakIcon:      "🔥",
    isEvolved:       false,
  },
  [PetPersonality.CarefulLearner]: {
    personality:     PetPersonality.CarefulLearner,
    label:           "Careful Learner",
    description:     "Your pet is precise and calm — it flows through problems with quiet confidence.",
    icon:            "🎯",
    animationClass:  "animate-none",
    auraColor:       "blue",
    badgeColor:      "bg-blue-100 text-blue-800 border-blue-200",
    isEvolved:       false,
  },
  [PetPersonality.PersistentExplorer]: {
    personality:     PetPersonality.PersistentExplorer,
    label:           "Persistent Explorer",
    description:     "Your pet loves to explore! It performs discovery dances when you tackle new topics.",
    icon:            "🗺️",
    animationClass:  "animate-bounce",
    auraColor:       "green",
    badgeColor:      "bg-green-100 text-green-800 border-green-200",
    isEvolved:       false,
  },
  [PetPersonality.MathWizard]: {
    personality:     PetPersonality.MathWizard,
    label:           "Math Wizard",
    description:     "Your pet glows with mastery! A shimmering aura appears when concepts are conquered.",
    icon:            "✨",
    animationClass:  "animate-pulse",
    auraColor:       "purple",
    badgeColor:      "bg-purple-100 text-purple-800 border-purple-200",
    isEvolved:       false,
  },

  // ── Evolved ────────────────────────────────────────────────────────────────
  [PetPersonality.LightningThinker]: {
    personality:     PetPersonality.LightningThinker,
    label:           "Lightning Thinker ⭐",
    description:     "Ultra-fast and unstoppable — your pet leaves a lightning trail on every correct answer.",
    icon:            "⚡⚡",
    animationClass:  "animate-bounce",
    auraColor:       "yellow",
    badgeColor:      "bg-yellow-200 text-yellow-900 border-yellow-300",
    isEvolved:       true,
  },
  [PetPersonality.LegendaryStreak]: {
    personality:     PetPersonality.LegendaryStreak,
    label:           "Legendary Streak Master ⭐",
    description:     "An unstoppable force of habit — your pet blazes with legendary flames.",
    icon:            "🔥🏆",
    animationClass:  "animate-pulse",
    auraColor:       "red",
    badgeColor:      "bg-red-200 text-red-900 border-red-300",
    streakIcon:      "🔥🏆",
    isEvolved:       true,
  },
  [PetPersonality.GrandMathWizard]: {
    personality:     PetPersonality.GrandMathWizard,
    label:           "Grand Math Wizard ⭐",
    description:     "Mastery across all concepts — your pet radiates a brilliant golden aura.",
    icon:            "🌟",
    animationClass:  "animate-pulse",
    auraColor:       "purple",
    badgeColor:      "bg-purple-200 text-purple-900 border-purple-300",
    isEvolved:       true,
  },
  [PetPersonality.MasterSolver]: {
    personality:     PetPersonality.MasterSolver,
    label:           "Master Solver ⭐",
    description:     "Never defeated — your pet celebrates every second-chance win with a victory dance.",
    icon:            "🏆",
    animationClass:  "animate-pulse",
    auraColor:       "orange",
    badgeColor:      "bg-orange-200 text-orange-900 border-orange-300",
    isEvolved:       true,
  },
  [PetPersonality.ZenLearner]: {
    personality:     PetPersonality.ZenLearner,
    label:           "Zen Learner ⭐",
    description:     "Near-perfect accuracy with complete independence — your pet moves with serene grace.",
    icon:            "☯️",
    animationClass:  "animate-none",
    auraColor:       "blue",
    badgeColor:      "bg-blue-200 text-blue-900 border-blue-300",
    isEvolved:       true,
  },
  [PetPersonality.RelentlessExplorer]: {
    personality:     PetPersonality.RelentlessExplorer,
    label:           "Relentless Explorer ⭐",
    description:     "500+ questions and still going! Your pet maps uncharted math territory.",
    icon:            "🗺️🌟",
    animationClass:  "animate-bounce",
    auraColor:       "green",
    badgeColor:      "bg-green-200 text-green-900 border-green-300",
    isEvolved:       true,
  },
};

// ─── Parent Insight Messages ───────────────────────────────────────────────────

/**
 * Human-readable insight for the parent dashboard.
 * Parameterised with `{name}` and `{petName}` placeholder strings.
 */
export const PERSONALITY_PARENT_INSIGHTS: Record<PetPersonality, string> = {
  [PetPersonality.FastThinker]:
    "{name}'s {petName} developed the Fast Thinker personality — {name} consistently solves questions quickly, showing strong number fluency.",
  [PetPersonality.ProblemSolver]:
    "{name}'s {petName} became a Problem Solver — {name} doesn't give up on hard questions and keeps trying until they succeed.",
  [PetPersonality.StreakChampion]:
    "{name}'s {petName} is a Streak Champion — {name} has been practising every day, building a powerful study habit.",
  [PetPersonality.CarefulLearner]:
    "{name}'s {petName} is a Careful Learner — {name} solves problems accurately and rarely needs hints, showing great independent thinking.",
  [PetPersonality.PersistentExplorer]:
    "{name}'s {petName} is a Persistent Explorer — {name} tackles many topics and keeps going even when things are difficult.",
  [PetPersonality.MathWizard]:
    "{name}'s {petName} reached Math Wizard status — {name} has mastered a wide range of math concepts across multiple topics.",
  [PetPersonality.LightningThinker]:
    "{name}'s {petName} evolved into Lightning Thinker — {name}'s mental math speed is exceptional. They're solving problems faster than ever!",
  [PetPersonality.LegendaryStreak]:
    "{name}'s {petName} achieved Legendary Streak Master — {name} has maintained an incredible daily practice streak of 20+ days.",
  [PetPersonality.GrandMathWizard]:
    "{name}'s {petName} became a Grand Math Wizard — {name} has achieved 90%+ mastery across nearly all topics. Exceptional progress!",
  [PetPersonality.MasterSolver]:
    "{name}'s {petName} is now a Master Solver — {name} overcomes almost every challenge they face, showing incredible resilience.",
  [PetPersonality.ZenLearner]:
    "{name}'s {petName} evolved into Zen Learner — {name} solves with near-perfect accuracy and remarkable independence.",
  [PetPersonality.RelentlessExplorer]:
    "{name}'s {petName} is a Relentless Explorer — {name} has answered 500+ questions and keeps pushing forward. Truly unstoppable!",
};

// ─── Engine Class ──────────────────────────────────────────────────────────────

export class PetPersonalityEngine {

  /**
   * Determines whether a personality evaluation should run.
   * Returns true every PERSONALITY_EVAL_INTERVAL questions.
   */
  shouldEvaluate(previousTotal: number, newTotal: number): boolean {
    const prevMilestone = Math.floor(previousTotal / PERSONALITY_EVAL_INTERVAL);
    const newMilestone  = Math.floor(newTotal      / PERSONALITY_EVAL_INTERVAL);
    return newMilestone > prevMilestone || newTotal === PERSONALITY_EVAL_INTERVAL;
  }

  /**
   * Core detection function.
   * Given a set of behaviour metrics, returns the dominant personality.
   * Also considers evolution thresholds.
   *
   * Algorithm:
   *   1. Compute a normalised score (0–100) for each personality dimension.
   *   2. Pick the dimension with the highest score that exceeds its base threshold.
   *   3. Check if the evolved form's threshold is also met — upgrade if so.
   *   4. Tie-break on accuracyRate.
   */
  detect(metrics: PetBehaviorMetrics): {
    personality: PetPersonality;
    dominantScore: number;
    reason: string;
  } {
    const {
      accuracyRate,
      avgTimeSeconds,
      hintUsageRate,
      retrySuccessRate,
      questionsAnswered,
      conceptMasteryScore,
      streakLength,
    } = metrics;

    // Build candidate scores (0–100) for each dimension
    const candidates: { personality: PetPersonality; score: number; reason: string }[] = [];

    // ── Fast Thinker (speed) ────────────────────────────────────────────────
    if (avgTimeSeconds > 0 && avgTimeSeconds < SPEED_THRESHOLD) {
      // Score improves as time decreases. 18s = 0, 5s = 100
      const speedScore = Math.min(100, ((SPEED_THRESHOLD - avgTimeSeconds) / (SPEED_THRESHOLD - 5)) * 100);
      candidates.push({
        personality: PetPersonality.FastThinker,
        score: speedScore,
        reason: `avg_time_seconds ${avgTimeSeconds.toFixed(1)}s below speed threshold ${SPEED_THRESHOLD}s`,
      });
    }

    // ── Problem Solver (retry success) ─────────────────────────────────────
    if (retrySuccessRate >= 0.60) {
      const retryScore = retrySuccessRate * 100;
      candidates.push({
        personality: PetPersonality.ProblemSolver,
        score: retryScore,
        reason: `retry_success_rate ${(retrySuccessRate * 100).toFixed(0)}%`,
      });
    }

    // ── Streak Champion (streak) ────────────────────────────────────────────
    if (streakLength >= 7) {
      // Score caps at 30 days = 100
      const streakScore = Math.min(100, (streakLength / 30) * 100);
      candidates.push({
        personality: PetPersonality.StreakChampion,
        score: streakScore,
        reason: `streak_length ${streakLength} days`,
      });
    }

    // ── Careful Learner (accuracy + low hints) ─────────────────────────────
    if (accuracyRate >= 0.85 && hintUsageRate <= 0.25) {
      // Combined score: accuracy weighted 70%, hint independence 30%
      const carefulScore = (accuracyRate * 70) + ((1 - hintUsageRate) * 30);
      candidates.push({
        personality: PetPersonality.CarefulLearner,
        score: carefulScore,
        reason: `accuracy_rate ${(accuracyRate * 100).toFixed(0)}% and hint_usage_rate ${(hintUsageRate * 100).toFixed(0)}%`,
      });
    }

    // ── Persistent Explorer (high volume) ──────────────────────────────────
    if (questionsAnswered >= 100) {
      // Score caps at 500 questions = 100
      const explorerScore = Math.min(100, (questionsAnswered / 500) * 100);
      candidates.push({
        personality: PetPersonality.PersistentExplorer,
        score: explorerScore,
        reason: `questions_answered ${questionsAnswered}`,
      });
    }

    // ── Math Wizard (concept mastery) ──────────────────────────────────────
    if (conceptMasteryScore >= 0.75) {
      const wizardScore = conceptMasteryScore * 100;
      candidates.push({
        personality: PetPersonality.MathWizard,
        score: wizardScore,
        reason: `concept_mastery_score ${(conceptMasteryScore * 100).toFixed(0)}%`,
      });
    }

    // No candidates yet — student is just getting started, use CarefulLearner as default
    if (candidates.length === 0) {
      return {
        personality:   PetPersonality.CarefulLearner,
        dominantScore: 0,
        reason:        "not enough data yet — starting with Careful Learner",
      };
    }

    // Pick the highest-scoring candidate; tie-break on accuracyRate
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return accuracyRate > 0.5 ? -1 : 1;
    });

    const winner = candidates[0]!;

    // ── Check for evolution ────────────────────────────────────────────────
    const evolved = this.checkEvolution(winner.personality, metrics);
    if (evolved) {
      return {
        personality:   evolved,
        dominantScore: winner.score,
        reason:        `${winner.reason} (evolved)`,
      };
    }

    return {
      personality:   winner.personality,
      dominantScore: winner.score,
      reason:        winner.reason,
    };
  }

  /**
   * Checks whether a base personality qualifies for its evolved form.
   * Returns the evolved personality, or null if thresholds are not met.
   */
  private checkEvolution(
    base: PetPersonality,
    metrics: PetBehaviorMetrics
  ): PetPersonality | null {
    const { avgTimeSeconds, streakLength, conceptMasteryScore,
            retrySuccessRate, accuracyRate, hintUsageRate, questionsAnswered } = metrics;

    switch (base) {
      case PetPersonality.FastThinker:
        return avgTimeSeconds < EVOLVED_SPEED_THRESHOLD
          ? PetPersonality.LightningThinker
          : null;

      case PetPersonality.StreakChampion:
        return streakLength >= 20
          ? PetPersonality.LegendaryStreak
          : null;

      case PetPersonality.MathWizard:
        return conceptMasteryScore >= 0.90
          ? PetPersonality.GrandMathWizard
          : null;

      case PetPersonality.ProblemSolver:
        return retrySuccessRate >= 0.85
          ? PetPersonality.MasterSolver
          : null;

      case PetPersonality.CarefulLearner:
        return accuracyRate >= 0.95 && hintUsageRate <= 0.10
          ? PetPersonality.ZenLearner
          : null;

      case PetPersonality.PersistentExplorer:
        return questionsAnswered >= 500
          ? PetPersonality.RelentlessExplorer
          : null;

      default:
        return null;
    }
  }

  /** Returns the personality effects for display. */
  getEffects(personality: PetPersonality): PersonalityEffects {
    return PERSONALITY_EFFECTS[personality];
  }

  /**
   * Formats the parent-dashboard insight message.
   * Replaces {name} and {petName} placeholders.
   */
  formatInsight(
    personality: PetPersonality,
    studentName: string,
    petName: string
  ): string {
    const template = PERSONALITY_PARENT_INSIGHTS[personality];
    return template
      .replace(/\{name\}/g, studentName)
      .replace(/\{petName\}/g, petName);
  }

  /** Returns whether a personality is an evolved form. */
  isEvolved(personality: PetPersonality): boolean {
    return PERSONALITY_EFFECTS[personality]?.isEvolved ?? false;
  }
}

export const petPersonalityEngine = new PetPersonalityEngine();
