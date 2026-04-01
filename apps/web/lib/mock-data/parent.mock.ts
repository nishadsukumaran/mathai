/**
 * @module apps/web/lib/mock-data/parent.mock
 *
 * Mock parent portal data for 4 student personas.
 */

import type { ParentDashboardData } from "@/types/parent";

export const MOCK_PARENT_STRUGGLING: ParentDashboardData = {
  childName:     "Aisha",
  childGrade:    "Grade 4",
  learningScore: { overall: 38, mastery: 30, consistency: 25, effort: 55, accuracy: 35, improvement: 30 },
  learningStatus: "needs_attention",
  confidenceSignal: "needs_support",
  confidenceExplanation: "Confidence dipped — repeated challenges in Dividing Fractions may be the cause.",
  supportNeed: "high",
  currentFocus: { topicName: "Dividing Fractions", reason: "Recurring misconception with fraction inversion" },
  todayActivity: { questionsAnswered: 3, minutesActive: 5, sessionsCompleted: 1 },
  streak: { current: 1, longest: 4 },
  insightBasis: "Based on 45 questions answered, 3 recent sessions.",
  insights: [
    { id: "i1", type: "attention",  icon: "🎯", message: "A recurring mix-up with fraction inversion in Dividing Fractions — MathAI is targeting this with focused questions.", actionHint: "Ask your child to explain fraction inversion to you — teaching is a powerful way to learn.", priority: 1 },
    { id: "i2", type: "attention",  icon: "💛", message: "Confidence has dipped recently. A little encouragement at home can make a big difference.", actionHint: "Try saying \"I noticed you're working hard on maths — that's impressive.\"", priority: 2 },
    { id: "i3", type: "suggestion", icon: "💡", message: "Your child is relying on hints quite often. MathAI is gradually building their independence.", actionHint: "Encourage them to try answering before tapping the hint button.", priority: 3 },
  ],
  learningPersonality: [
    { icon: "🤝", label: "Support Seeker",     detail: "Likes to check with hints before answering — builds confidence through guidance." },
    { icon: "📋", label: "Step-by-Step Thinker", detail: "Prefers clear, ordered instructions and builds understanding methodically." },
  ],
  masteryClusters: {
    weakAreas:   [{ topicId: "g4-fractions-divide", topicName: "Dividing Fractions", status: "struggling", masteryPct: 22, accuracyPct: 30, daysSinceLastPractice: 1 }],
    improving:   [{ topicId: "g4-fractions-add", topicName: "Adding Fractions", status: "learning", masteryPct: 45, accuracyPct: 55, daysSinceLastPractice: 3 }],
    strong:      [{ topicId: "g4-addition", topicName: "Addition", status: "mastered", masteryPct: 88, accuracyPct: 90, daysSinceLastPractice: 10 }],
    revisionDue: [],
    notStarted:  2,
  },
  masteryMap: [
    { topicId: "g4-fractions-divide", topicName: "Dividing Fractions", status: "struggling", masteryPct: 22, accuracyPct: 30, daysSinceLastPractice: 1 },
    { topicId: "g4-fractions-add", topicName: "Adding Fractions", status: "learning", masteryPct: 45, accuracyPct: 55, daysSinceLastPractice: 3 },
    { topicId: "g4-addition", topicName: "Addition", status: "mastered", masteryPct: 88, accuracyPct: 90, daysSinceLastPractice: 10 },
  ],
  recentHighlights: [
    { type: "struggled", icon: "📌", message: "Struggled with Dividing Fractions", date: "2026-03-30T10:00:00Z" },
  ],
  nextRecommendation: { topicName: "Dividing Fractions", reason: "Repeated errors suggest this topic needs focused practice.", actionType: "review_mistake" },
};

export const MOCK_PARENT_IMPROVING: ParentDashboardData = {
  childName:     "Aryan",
  childGrade:    "Grade 4",
  learningScore: { overall: 62, mastery: 55, consistency: 70, effort: 75, accuracy: 60, improvement: 85 },
  learningStatus: "on_track",
  confidenceSignal: "rising",
  confidenceExplanation: "Confidence is rising — improvement in Multiplication is helping.",
  supportNeed: "low",
  currentFocus: { topicName: "Decimal Addition", reason: "Improving well — nearly ready for mastery" },
  todayActivity: { questionsAnswered: 12, minutesActive: 8, sessionsCompleted: 2 },
  streak: { current: 7, longest: 12 },
  insightBasis: "Based on 120 questions answered, 5 recent sessions, 7-day streak.",
  insights: [
    { id: "i1", type: "celebration", icon: "📈", message: "Confidence is rising! Your child is feeling more sure of themselves.", actionHint: "Keep the positive momentum going with a quick \"well done\" at dinner.", priority: 4 },
    { id: "i2", type: "improvement", icon: "🌱", message: "Decimal Addition is coming along nicely — almost ready for mastery!", actionHint: "A few more practice sessions on decimal addition could push it to mastered.", priority: 4 },
    { id: "i3", type: "celebration", icon: "🔥", message: "7-day practice streak! Consistency is key to learning.", actionHint: "Streaks matter more than long sessions — keep the daily habit going.", priority: 5 },
    { id: "i4", type: "strength",    icon: "💪", message: "Your child is doing really well in Addition and Multiplication. Great foundation!", actionHint: "Celebrate this with them — recognition builds motivation.", priority: 5 },
  ],
  learningPersonality: [
    { icon: "🦁", label: "Independent Solver", detail: "Prefers to work through problems alone before asking for help." },
    { icon: "🔥", label: "Consistent Practiser", detail: "Practices regularly — this habit is one of the strongest predictors of success." },
    { icon: "💪", label: "Resilient Learner", detail: "Shows steady improvement across multiple topics after initial challenges." },
  ],
  masteryClusters: {
    weakAreas:   [],
    improving:   [
      { topicId: "g4-decimals-add", topicName: "Decimal Addition", status: "improving", masteryPct: 65, accuracyPct: 72, daysSinceLastPractice: 1 },
      { topicId: "g4-fractions", topicName: "Fractions Basics", status: "learning", masteryPct: 48, accuracyPct: 55, daysSinceLastPractice: 2 },
    ],
    strong: [
      { topicId: "g4-addition", topicName: "Addition", status: "mastered", masteryPct: 92, accuracyPct: 95, daysSinceLastPractice: 5 },
      { topicId: "g4-multiply", topicName: "Multiplication", status: "mastered", masteryPct: 85, accuracyPct: 88, daysSinceLastPractice: 3 },
    ],
    revisionDue: [],
    notStarted: 3,
  },
  masteryMap: [
    { topicId: "g4-decimals-add", topicName: "Decimal Addition", status: "improving", masteryPct: 65, accuracyPct: 72, daysSinceLastPractice: 1 },
    { topicId: "g4-addition", topicName: "Addition", status: "mastered", masteryPct: 92, accuracyPct: 95, daysSinceLastPractice: 5 },
    { topicId: "g4-multiply", topicName: "Multiplication", status: "mastered", masteryPct: 85, accuracyPct: 88, daysSinceLastPractice: 3 },
    { topicId: "g4-fractions", topicName: "Fractions Basics", status: "learning", masteryPct: 48, accuracyPct: 55, daysSinceLastPractice: 2 },
  ],
  recentHighlights: [
    { type: "streak",         icon: "🔥", message: "7-day practice streak",       date: "2026-03-31T08:00:00Z" },
    { type: "mastered_topic", icon: "🏆", message: "Mastered Multiplication!",    date: "2026-03-28T14:00:00Z" },
    { type: "badge_earned",   icon: "🎖️", message: "Earned \"Fraction Fighter\"", date: "2026-03-27T12:00:00Z" },
  ],
  nextRecommendation: { topicName: "Decimal Addition", reason: "You're making real progress — keep going to master this topic!", actionType: "continue_path" },
};

export const MOCK_PARENT_STRONG: ParentDashboardData = {
  childName:     "Zara",
  childGrade:    "Grade 5",
  learningScore: { overall: 88, mastery: 90, consistency: 85, effort: 90, accuracy: 92, improvement: 75 },
  learningStatus: "excellent",
  confidenceSignal: "rising",
  confidenceExplanation: "Confidence is rising with steady practice and progress.",
  supportNeed: "low",
  currentFocus: { topicName: "Introduction to Algebra", reason: "Ready for a challenge beyond current grade" },
  todayActivity: { questionsAnswered: 20, minutesActive: 15, sessionsCompleted: 3 },
  streak: { current: 14, longest: 14 },
  insightBasis: "Based on 280 questions answered, 5 recent sessions, 14-day streak.",
  insights: [
    { id: "i1", type: "strength",    icon: "💪", message: "Your child is doing really well in Fractions and Geometry. Great foundation!", actionHint: "Celebrate this with them — recognition builds motivation.", priority: 5 },
    { id: "i2", type: "celebration", icon: "🔥", message: "14-day practice streak! Consistency is key to learning.", actionHint: "Streaks matter more than long sessions — keep the daily habit going.", priority: 5 },
    { id: "i3", type: "suggestion",  icon: "🔄", message: "Decimal Subtraction was mastered but hasn't been practised recently. A quick revision would help keep it fresh.", actionHint: "Suggest a 5-minute decimal subtraction refresher this weekend.", priority: 3 },
  ],
  learningPersonality: [
    { icon: "🦁", label: "Independent Solver", detail: "Prefers to work through problems alone before asking for help." },
    { icon: "⚡", label: "Quick Thinker", detail: "Moves through problems fast — may benefit from pausing on tricky ones." },
    { icon: "🔥", label: "Consistent Practiser", detail: "Practices regularly — this habit is one of the strongest predictors of success." },
  ],
  masteryClusters: {
    weakAreas:   [],
    improving:   [{ topicId: "g5-algebra", topicName: "Intro to Algebra", status: "learning", masteryPct: 40, accuracyPct: 65, daysSinceLastPractice: 1 }],
    strong:      [
      { topicId: "g5-fractions", topicName: "Fractions", status: "mastered", masteryPct: 95, accuracyPct: 96, daysSinceLastPractice: 2 },
      { topicId: "g5-geometry", topicName: "Geometry", status: "mastered", masteryPct: 88, accuracyPct: 90, daysSinceLastPractice: 4 },
    ],
    revisionDue: [{ topicId: "g5-decimals-sub", topicName: "Decimal Subtraction", status: "needs_revision", masteryPct: 82, accuracyPct: 85, daysSinceLastPractice: 18 }],
    notStarted: 1,
  },
  masteryMap: [
    { topicId: "g5-fractions", topicName: "Fractions", status: "mastered", masteryPct: 95, accuracyPct: 96, daysSinceLastPractice: 2 },
    { topicId: "g5-geometry", topicName: "Geometry", status: "mastered", masteryPct: 88, accuracyPct: 90, daysSinceLastPractice: 4 },
    { topicId: "g5-decimals-sub", topicName: "Decimal Subtraction", status: "needs_revision", masteryPct: 82, accuracyPct: 85, daysSinceLastPractice: 18 },
    { topicId: "g5-algebra", topicName: "Intro to Algebra", status: "learning", masteryPct: 40, accuracyPct: 65, daysSinceLastPractice: 1 },
  ],
  recentHighlights: [
    { type: "streak",         icon: "🔥", message: "14-day practice streak!", date: "2026-03-31T08:00:00Z" },
    { type: "mastered_topic", icon: "🏆", message: "Mastered Geometry!",      date: "2026-03-29T10:00:00Z" },
    { type: "difficulty_up",  icon: "🚀", message: "Moved to harder questions", date: "2026-03-28T15:00:00Z" },
  ],
  nextRecommendation: { topicName: "Introduction to Algebra", reason: "Ready to push yourself with a challenge?", actionType: "challenge" },
};

export const MOCK_PARENT_REVISION: ParentDashboardData = {
  childName:     "Omar",
  childGrade:    "Grade 3",
  learningScore: { overall: 55, mastery: 65, consistency: 30, effort: 40, accuracy: 70, improvement: 50 },
  learningStatus: "needs_attention",
  confidenceSignal: "stable",
  confidenceExplanation: "Confidence is holding steady at a healthy level.",
  supportNeed: "moderate",
  currentFocus: { topicName: "Multi-digit Multiplication", reason: "Needs revision to retain progress" },
  todayActivity: { questionsAnswered: 0, minutesActive: 0, sessionsCompleted: 0 },
  streak: { current: 0, longest: 8 },
  insightBasis: "Based on 80 questions answered, 2 recent sessions.",
  insights: [
    { id: "i1", type: "suggestion", icon: "🔄", message: "Multi-digit Multiplication was mastered but hasn't been practised recently. A quick revision would help keep it fresh.", actionHint: "Suggest a 5-minute multi-digit multiplication refresher this weekend.", priority: 3 },
    { id: "i2", type: "attention",  icon: "📌", message: "Subtraction still needs some support. MathAI is focusing practice here.", actionHint: "Encourage 10 minutes of subtraction practice this week.", priority: 2 },
  ],
  learningPersonality: [
    { icon: "🐢", label: "Careful Thinker", detail: "Takes time to think through each problem — accuracy tends to be strong." },
    { icon: "📋", label: "Step-by-Step Thinker", detail: "Prefers clear, ordered instructions and builds understanding methodically." },
  ],
  masteryClusters: {
    weakAreas:   [{ topicId: "g3-subtraction", topicName: "Subtraction", status: "struggling", masteryPct: 35, accuracyPct: 42, daysSinceLastPractice: 5 }],
    improving:   [],
    strong:      [{ topicId: "g3-addition", topicName: "Addition", status: "mastered", masteryPct: 90, accuracyPct: 92, daysSinceLastPractice: 8 }],
    revisionDue: [{ topicId: "g3-multiply-multi", topicName: "Multi-digit Multiplication", status: "needs_revision", masteryPct: 80, accuracyPct: 82, daysSinceLastPractice: 16 }],
    notStarted: 4,
  },
  masteryMap: [
    { topicId: "g3-multiply-multi", topicName: "Multi-digit Multiplication", status: "needs_revision", masteryPct: 80, accuracyPct: 82, daysSinceLastPractice: 16 },
    { topicId: "g3-subtraction", topicName: "Subtraction", status: "struggling", masteryPct: 35, accuracyPct: 42, daysSinceLastPractice: 5 },
    { topicId: "g3-addition", topicName: "Addition", status: "mastered", masteryPct: 90, accuracyPct: 92, daysSinceLastPractice: 8 },
  ],
  recentHighlights: [
    { type: "mastered_topic", icon: "🏆", message: "Mastered Addition!",       date: "2026-03-23T12:00:00Z" },
    { type: "badge_earned",   icon: "🎖️", message: "Earned \"Streak Shield\"", date: "2026-03-20T10:00:00Z" },
  ],
  nextRecommendation: { topicName: "Multi-digit Multiplication", reason: "It's been a while — a quick revision will keep it fresh.", actionType: "revise" },
};

export const MOCK_PARENT_DASHBOARD: ParentDashboardData = MOCK_PARENT_IMPROVING;
