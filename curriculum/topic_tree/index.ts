/**
 * @module curriculum/topic_tree
 *
 * The curriculum topic tree defines the full hierarchy of math topics in MathAI:
 *
 *   Grade
 *     └── Strand (e.g., Numbers, Fractions, Geometry)
 *           └── Topic (e.g., "Adding Fractions with Unlike Denominators")
 *                 └── Subtopic
 *                       └── Lesson
 *                             └── Practice Set
 *
 * This module is the authoritative source for:
 *   - What topics exist and in what order
 *   - Which topics are prerequisites for which
 *   - Mastery thresholds per topic
 *   - Grade-level alignment
 *
 * In production, this data is seeded to PostgreSQL and queried via Prisma.
 * The in-memory structure here serves as the source of truth for seeding
 * and as a fallback for tests.
 */

import { Grade, Strand, Topic, Subtopic } from "@/types";

// ─── Topic Tree Definition ──────────────────────────────────────────────────────

export const CURRICULUM_TREE: CurriculumGrade[] = [
  {
    grade: Grade.G1,
    strands: [
      {
        strand: Strand.Numbers,
        topics: [
          {
            id: "g1-numbers-counting",
            slug: "counting-to-100",
            name: "Counting to 100",
            strand: Strand.Numbers,
            grade: Grade.G1,
            description: "Count, read, and write numbers to 100",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 30,
            iconEmoji: "🔢",
          },
          {
            id: "g1-numbers-place-value",
            slug: "place-value-tens-ones",
            name: "Place Value: Tens and Ones",
            strand: Strand.Numbers,
            grade: Grade.G1,
            description: "Understand tens and ones using base-10 blocks",
            prerequisites: ["g1-numbers-counting"],
            masteryThreshold: 0.8,
            estimatedMinutes: 45,
            iconEmoji: "🏗️",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Operations,
        topics: [
          {
            id: "g1-ops-addition",
            slug: "addition-to-20",
            name: "Addition to 20",
            strand: Strand.Operations,
            grade: Grade.G1,
            description: "Add numbers with sums up to 20",
            prerequisites: ["g1-numbers-counting"],
            masteryThreshold: 0.85,
            estimatedMinutes: 40,
            iconEmoji: "➕",
          },
          {
            id: "g1-ops-subtraction",
            slug: "subtraction-to-20",
            name: "Subtraction to 20",
            strand: Strand.Operations,
            grade: Grade.G1,
            description: "Subtract numbers within 20",
            prerequisites: ["g1-ops-addition"],
            masteryThreshold: 0.85,
            estimatedMinutes: 40,
            iconEmoji: "➖",
          },
        ],
        subtopics: [],
      },
    ],
  },
  {
    grade: Grade.G3,
    strands: [
      {
        strand: Strand.Operations,
        topics: [
          {
            id: "g3-ops-multiplication",
            slug: "multiplication-1digit",
            name: "Multiplication — 1-Digit Numbers",
            strand: Strand.Operations,
            grade: Grade.G3,
            description: "Understand multiplication as repeated addition and equal groups",
            prerequisites: ["g1-ops-addition"],
            masteryThreshold: 0.8,
            estimatedMinutes: 60,
            iconEmoji: "✖️",
          },
          {
            id: "g3-ops-division",
            slug: "division-basic",
            name: "Division — Basic",
            strand: Strand.Operations,
            grade: Grade.G3,
            description: "Divide objects into equal groups; relate to multiplication",
            prerequisites: ["g3-ops-multiplication"],
            masteryThreshold: 0.8,
            estimatedMinutes: 60,
            iconEmoji: "➗",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Fractions,
        topics: [
          {
            id: "g3-fractions-intro",
            slug: "fractions-intro",
            name: "Introduction to Fractions",
            strand: Strand.Fractions,
            grade: Grade.G3,
            description: "Understand fractions as parts of a whole; identify numerator and denominator",
            prerequisites: ["g3-ops-division"],
            masteryThreshold: 0.75,
            estimatedMinutes: 50,
            iconEmoji: "🍕",
          },
        ],
        subtopics: [],
      },
    ],
  },
  {
    grade: Grade.G4,
    strands: [
      {
        strand: Strand.Fractions,
        topics: [
          {
            id: "g4-fractions-add",
            slug: "fraction-addition",
            name: "Adding Fractions with Unlike Denominators",
            strand: Strand.Fractions,
            grade: Grade.G4,
            description: "Add fractions by finding a common denominator",
            prerequisites: ["g3-fractions-intro"],
            masteryThreshold: 0.8,
            estimatedMinutes: 55,
            iconEmoji: "🍰",
          },
          {
            id: "g4-fractions-subtract",
            slug: "fraction-subtraction",
            name: "Subtracting Fractions",
            strand: Strand.Fractions,
            grade: Grade.G4,
            description: "Subtract fractions with and without like denominators",
            prerequisites: ["g4-fractions-add"],
            masteryThreshold: 0.8,
            estimatedMinutes: 55,
            iconEmoji: "🍕",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Operations,
        topics: [
          {
            id: "g4-ops-mult-2digit",
            slug: "multiplication-2digit",
            name: "Multiplying 2-Digit Numbers",
            strand: Strand.Operations,
            grade: Grade.G4,
            description: "Multiply two 2-digit numbers using the area model and standard algorithm",
            prerequisites: ["g3-ops-multiplication"],
            masteryThreshold: 0.8,
            estimatedMinutes: 65,
            iconEmoji: "✖️",
          },
        ],
        subtopics: [],
      },
    ],
  },
];

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Returns all topics for a given grade, in curriculum order.
 */
export function getTopicsForGrade(grade: Grade): Topic[] {
  const gradeEntry = CURRICULUM_TREE.find((g) => g.grade === grade);
  if (!gradeEntry) return [];
  return gradeEntry.strands.flatMap((s) => s.topics);
}

/**
 * Returns a specific topic by its ID.
 */
export function getTopicById(topicId: string): Topic | undefined {
  for (const grade of CURRICULUM_TREE) {
    for (const strand of grade.strands) {
      const found = strand.topics.find((t) => t.id === topicId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Returns all prerequisite topics for a given topic, recursively flattened.
 */
export function getPrerequisiteChain(topicId: string): Topic[] {
  const topic = getTopicById(topicId);
  if (!topic || topic.prerequisites.length === 0) return [];

  const prereqs = topic.prerequisites
    .map((pid) => getTopicById(pid))
    .filter((t): t is Topic => t !== undefined);

  return [...prereqs, ...prereqs.flatMap((p) => getPrerequisiteChain(p.id))];
}

// ─── Internal Types ────────────────────────────────────────────────────────────

interface CurriculumGrade {
  grade: Grade;
  strands: CurriculumStrand[];
}

interface CurriculumStrand {
  strand: Strand;
  topics: Topic[];
  subtopics: Subtopic[];
}
