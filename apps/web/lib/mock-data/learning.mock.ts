/**
 * @module apps/web/lib/mock-data/learning.mock
 *
 * Mock LearningNextAction responses for 4 student personas.
 * Used when NEXT_PUBLIC_USE_MOCK_DATA=true.
 *
 * Personas:
 *   1. Weak student — struggling with fractions, low confidence
 *   2. Recovering student — improving on a previously weak topic
 *   3. Strong student — ready for a challenge
 *   4. Revision-due student — hasn't practised a mastered topic in a while
 */

import type { LearningNextAction } from "@mathai/shared-types";

/** Student struggling with fraction division — needs focused remediation */
export const MOCK_LEARNING_WEAK: LearningNextAction = {
  type:                     "review_mistake",
  topicId:                  "g4-fractions-divide",
  topicName:                "Dividing Fractions",
  difficulty:               "easy",
  reason:                   "You've been tripping up on fraction-inversion in Dividing Fractions. Let's work through it together so it clicks.",
  encouragement:            "Mistakes are how we learn — you've got this!",
  confidenceTarget:         55,
  sessionMode:              "guided",
  recommendedQuestionCount: 3,
  explanationPreference:    "step_by_step",
  sourceSignals: {
    weakArea:      true,
    lowConfidence: true,
    recentErrors:  true,
    hintDependency: true,
  },
};

/** Student recovering — was weak on decimals, now improving */
export const MOCK_LEARNING_RECOVERING: LearningNextAction = {
  type:                     "continue_path",
  topicId:                  "g4-decimals-add",
  topicName:                "Adding Decimals",
  difficulty:               "medium",
  reason:                   "You're making real progress on Adding Decimals! Keep going and you'll master it soon.",
  encouragement:            "Your progress is really showing!",
  confidenceTarget:         65,
  sessionMode:              "focus",
  recommendedQuestionCount: 5,
  explanationPreference:    "adaptive",
  sourceSignals: {
    masteryReady: true,
  },
};

/** Strong student — mastered most topics, ready for a push */
export const MOCK_LEARNING_STRONG: LearningNextAction = {
  type:                     "challenge",
  topicId:                  "g5-algebra-intro",
  topicName:                "Introduction to Algebra",
  difficulty:               "hard",
  reason:                   "You've got your current topics down well. Ready to push yourself with a challenge?",
  encouragement:            "Time to show what you're made of!",
  sessionMode:              "challenge",
  recommendedQuestionCount: 5,
  explanationPreference:    "concise",
  sourceSignals: {
    masteryReady: true,
  },
};

/** Student who hasn't revisited a previously strong topic */
export const MOCK_LEARNING_REVISION: LearningNextAction = {
  type:                     "revise",
  topicId:                  "g4-multiplication-multi",
  topicName:                "Multi-digit Multiplication",
  difficulty:               "medium",
  reason:                   "It's been a while since you practised Multi-digit Multiplication. A quick revision will keep it fresh in your memory.",
  encouragement:            "Revision is the secret weapon of great learners!",
  sessionMode:              "revision",
  recommendedQuestionCount: 4,
  explanationPreference:    "adaptive",
  sourceSignals: {
    revisionDue:    true,
    neglectedTopic: true,
  },
};

/**
 * Default mock for the dashboard — cycles through personas.
 * In real mock mode, we return the "recovering" scenario as the default
 * since it's the most balanced and representative.
 */
export const MOCK_LEARNING_NEXT: LearningNextAction = MOCK_LEARNING_RECOVERING;
