/**
 * Mock responses for:
 *   GET /api/curriculum?grade=G4         → MOCK_CURRICULUM
 *   GET /api/curriculum/topic/:topicId   → MOCK_TOPIC_DETAIL
 * Screens: /curriculum, /topic/:id
 */

import type { CurriculumData, TopicDetail } from "@mathai/shared-types";

export const MOCK_CURRICULUM: CurriculumData = {
  grade: "G4",
  topics: [
    {
      id:           "g4-fractions-add",
      name:         "Adding Fractions",
      description:  "Add fractions with like and unlike denominators.",
      grade:        "G4",
      strand:       "Number & Operations — Fractions",
      masteryLevel: "developing",
      isUnlocked:   true,
      lessonCount:  4,
      iconSlug:     "fractions",
    },
    {
      id:           "g4-fractions-sub",
      name:         "Subtracting Fractions",
      description:  "Subtract fractions and mixed numbers.",
      grade:        "G4",
      strand:       "Number & Operations — Fractions",
      masteryLevel: "not_started",
      isUnlocked:   false,
      lessonCount:  3,
      iconSlug:     "fractions",
    },
    {
      id:           "g4-multiplication",
      name:         "Multi-Digit Multiplication",
      description:  "Multiply up to 4-digit numbers.",
      grade:        "G4",
      strand:       "Number & Operations in Base Ten",
      masteryLevel: "mastered",
      isUnlocked:   true,
      lessonCount:  5,
      iconSlug:     "multiplication",
    },
    {
      id:           "g4-place-value",
      name:         "Place Value to Millions",
      description:  "Read, write, and compare numbers to 1,000,000.",
      grade:        "G4",
      strand:       "Number & Operations in Base Ten",
      masteryLevel: "emerging",
      isUnlocked:   true,
      lessonCount:  3,
      iconSlug:     "place-value",
    },
  ],
};

export const MOCK_TOPIC_DETAIL: TopicDetail = {
  id:           "g4-fractions-add",
  name:         "Adding Fractions",
  description:  "Add fractions with like and unlike denominators. By the end, you'll handle mixed numbers too!",
  grade:        "G4",
  strand:       "Number & Operations — Fractions",
  masteryLevel: "developing",
  isUnlocked:   true,
  lessons: [
    {
      id:           "lesson-fractions-add-intro",
      title:        "Adding with the Same Bottom Number",
      description:  "When denominators match, just add the tops!",
      state:        "mastered",
      estimatedMin: 10,
      xpReward:     30,
    },
    {
      id:           "lesson-fractions-add-unlike",
      title:        "Finding the Common Denominator",
      description:  "Learn to find the LCD so you can add any two fractions.",
      state:        "in_progress",
      estimatedMin: 15,
      xpReward:     40,
    },
    {
      id:           "lesson-fractions-add-mixed",
      title:        "Adding Mixed Numbers",
      description:  "Whole numbers plus fractions — combine them like a pro.",
      state:        "locked",
      estimatedMin: 15,
      xpReward:     40,
    },
    {
      id:           "lesson-fractions-add-word",
      title:        "Word Problems with Fractions",
      description:  "Real-world fraction problems. Pizza counts as real-world.",
      state:        "locked",
      estimatedMin: 20,
      xpReward:     50,
    },
  ],
};
