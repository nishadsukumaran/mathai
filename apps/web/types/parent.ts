/**
 * @module apps/web/types/parent
 *
 * Frontend view contracts for the parent portal.
 * Mirrors GET /api/parent/dashboard/:childId response.
 */

export interface LearningScore {
  overall:     number;
  mastery:     number;
  consistency: number;
  effort:      number;
  accuracy:    number;
  improvement: number;
}

export type LearningStatus   = "excellent" | "on_track" | "needs_attention";
export type ConfidenceSignal = "rising" | "stable" | "needs_support";
export type SupportNeedLevel = "low" | "moderate" | "high";

export interface ParentInsight {
  id:          string;
  type:        "strength" | "improvement" | "attention" | "suggestion" | "celebration";
  icon:        string;
  message:     string;
  actionHint?: string;
  priority:    number;
}

export interface LearningPersonalityTrait {
  icon:   string;
  label:  string;
  detail: string;
}

export interface TopicMasteryItem {
  topicId:    string;
  topicName:  string;
  status:     "not_started" | "learning" | "struggling" | "improving" | "mastered" | "needs_revision";
  masteryPct: number;
  accuracyPct: number;
  daysSinceLastPractice: number;
}

export interface MasteryClusters {
  weakAreas:   TopicMasteryItem[];
  improving:   TopicMasteryItem[];
  strong:      TopicMasteryItem[];
  revisionDue: TopicMasteryItem[];
  notStarted:  number;
}

export interface RecentHighlight {
  type:    string;
  icon:    string;
  message: string;
  date:    string;
}

export interface ParentDashboardData {
  childName:             string;
  childGrade:            string;
  learningScore:         LearningScore;
  learningStatus:        LearningStatus;
  confidenceSignal:      ConfidenceSignal;
  confidenceExplanation: string;
  supportNeed:           SupportNeedLevel;
  currentFocus:          { topicName: string; reason: string } | null;
  todayActivity:         { questionsAnswered: number; minutesActive: number; sessionsCompleted: number };
  streak:                { current: number; longest: number };
  insights:              ParentInsight[];
  insightBasis:          string;
  learningPersonality:   LearningPersonalityTrait[];
  masteryClusters:       MasteryClusters;
  masteryMap:            TopicMasteryItem[];
  recentHighlights:      RecentHighlight[];
  nextRecommendation:    { topicName: string; reason: string; actionType: string } | null;
}
