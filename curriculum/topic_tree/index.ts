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

import { Grade, Strand, Topic } from "@/types";

// ─── Local Types ────────────────────────────────────────────────────────────────

/**
 * Lightweight static representation of a topic as stored in the in-memory
 * curriculum tree. Uses `strand` (enum) and `grade` (enum) instead of the
 * DB-mapped `strandId` (string) and `gradeBand` (Grade) fields on `Topic`.
 * Converted to the full `Topic` shape by `curriculumService.normalizeTopic()`.
 */
interface StaticTopic {
  id:               string;
  slug:             string;
  name:             string;
  strand:           Strand;
  grade:            Grade;
  description:      string;
  prerequisites:    string[];
  masteryThreshold: number;
  estimatedMinutes: number;
  iconEmoji?:       string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Subtopic {}

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
  // ─── Grade 2 ────────────────────────────────────────────────────────────────
  {
    grade: Grade.G2,
    strands: [
      {
        strand: Strand.Numbers,
        topics: [
          {
            id: "g2-numbers-place-value",
            slug: "place-value-hundreds",
            name: "Place Value to Hundreds",
            strand: Strand.Numbers,
            grade: Grade.G2,
            description: "Understand that digits in each place represent amounts of ones, tens, and hundreds.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 30,
            iconEmoji: "🏛️",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Fractions,
        topics: [
          {
            id: "g2-fractions-intro",
            slug: "intro-to-fractions",
            name: "Introduction to Fractions",
            strand: Strand.Fractions,
            grade: Grade.G2,
            description: "Understand a fraction as a part of a whole; identify halves, thirds, and quarters using shapes and sets.",
            prerequisites: ["g2-numbers-place-value"],
            masteryThreshold: 0.8,
            estimatedMinutes: 30,
            iconEmoji: "🥧",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Measurement,
        topics: [
          {
            id: "g2-measurement-length",
            slug: "measuring-length",
            name: "Measuring Length",
            strand: Strand.Measurement,
            grade: Grade.G2,
            description: "Measure and compare lengths using cm, m, and km; convert between units.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 25,
            iconEmoji: "📏",
          },
          {
            id: "g2-measurement-time",
            slug: "time-and-clocks",
            name: "Telling Time & Elapsed Time",
            strand: Strand.Measurement,
            grade: Grade.G2,
            description: "Read analogue and digital clocks; calculate elapsed time across hours and minutes.",
            prerequisites: ["g2-measurement-length"],
            masteryThreshold: 0.8,
            estimatedMinutes: 30,
            iconEmoji: "🕐",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.WordProblems,
        topics: [
          {
            id: "g2-word-problems-addition",
            slug: "word-problems-addition",
            name: "Addition & Subtraction Word Problems",
            strand: Strand.WordProblems,
            grade: Grade.G2,
            description: "Model and solve one- and two-step word problems using addition and subtraction strategies.",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 30,
            iconEmoji: "📖",
          },
        ],
        subtopics: [],
      },
    ],
  },
  // ─── Grade 5 ────────────────────────────────────────────────────────────────
  {
    grade: Grade.G5,
    strands: [
      {
        strand: Strand.Operations,
        topics: [
          {
            id: "g5-ops-order-of-operations",
            slug: "order-of-operations",
            name: "Order of Operations (BODMAS)",
            strand: Strand.Operations,
            grade: Grade.G5,
            description: "Apply BODMAS/PEMDAS rules to evaluate expressions with multiple operations including brackets.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "🎭",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Fractions,
        topics: [
          {
            id: "g5-fractions-adding",
            slug: "adding-fractions",
            name: "Adding & Subtracting Fractions",
            strand: Strand.Fractions,
            grade: Grade.G5,
            description: "Add and subtract fractions with like and unlike denominators; simplify results.",
            prerequisites: ["g4-fractions-add"],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "🔂",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Decimals,
        topics: [
          {
            id: "g5-decimals-operations",
            slug: "decimal-operations",
            name: "Decimal Operations",
            strand: Strand.Decimals,
            grade: Grade.G5,
            description: "Add, subtract, multiply, and divide decimals; apply to money and measurement contexts.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "💰",
          },
        ],
        subtopics: [],
      },
    ],
  },
  // ─── Grade 6 ────────────────────────────────────────────────────────────────
  {
    grade: Grade.G6,
    strands: [
      {
        strand: Strand.Numbers,
        topics: [
          {
            id: "g6-numbers-negative",
            slug: "negative-numbers",
            name: "Negative Numbers",
            strand: Strand.Numbers,
            grade: Grade.G6,
            description: "Understand and use negative numbers in context (temperature, sea level); order integers on a number line.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "🌡️",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Fractions,
        topics: [
          {
            id: "g6-fractions-multiply-divide",
            slug: "multiplying-fractions",
            name: "Multiplying & Dividing Fractions",
            strand: Strand.Fractions,
            grade: Grade.G6,
            description: "Multiply fractions by fractions and whole numbers; divide fractions using the reciprocal method.",
            prerequisites: ["g5-fractions-adding"],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "🔀",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Decimals,
        topics: [
          {
            id: "g6-decimals-percentages",
            slug: "percentages",
            name: "Percentages",
            strand: Strand.Decimals,
            grade: Grade.G6,
            description: "Convert between fractions, decimals, and percentages; calculate percentages of quantities.",
            prerequisites: ["g5-decimals-operations"],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "💯",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Geometry,
        topics: [
          {
            id: "g6-geometry-volume",
            slug: "volume",
            name: "Volume of 3D Shapes",
            strand: Strand.Geometry,
            grade: Grade.G6,
            description: "Calculate volume of rectangular prisms, triangular prisms, and cylinders using appropriate formulas.",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "📦",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.Algebra,
        topics: [
          {
            id: "g6-algebra-variables",
            slug: "intro-to-variables",
            name: "Introduction to Variables",
            strand: Strand.Algebra,
            grade: Grade.G6,
            description: "Use letters to represent unknown quantities; write and evaluate simple algebraic expressions.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "🔤",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.WordProblems,
        topics: [
          {
            id: "g6-word-problems-ratio",
            slug: "word-problems-ratio",
            name: "Ratio & Proportion Word Problems",
            strand: Strand.WordProblems,
            grade: Grade.G6,
            description: "Solve word problems involving ratios, rates, and proportional relationships.",
            prerequisites: ["g6-decimals-percentages", "g6-fractions-multiply-divide"],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "🔗",
          },
        ],
        subtopics: [],
      },
      {
        strand: Strand.DataAndProbability,
        topics: [
          {
            id: "g6-data-mean-median-mode",
            slug: "mean-median-mode",
            name: "Mean, Median, Mode & Range",
            strand: Strand.DataAndProbability,
            grade: Grade.G6,
            description: "Calculate and interpret measures of central tendency and spread for data sets.",
            prerequisites: [],
            masteryThreshold: 0.8,
            estimatedMinutes: 40,
            iconEmoji: "📈",
          },
        ],
        subtopics: [],
      },
    ],
  },
  // ─── Grade 7 ────────────────────────────────────────────────────────────────
  {
    grade: Grade.G7,
    strands: [
      {
        strand: Strand.Algebra,
        topics: [
          {
            id: "g7-algebra-linear-equations",
            slug: "linear-equations",
            name: "Solving Linear Equations",
            strand: Strand.Algebra,
            grade: Grade.G7,
            description: "Solve one- and two-step equations with one unknown; check solutions and interpret in context.",
            prerequisites: ["g6-algebra-variables"],
            masteryThreshold: 0.75,
            estimatedMinutes: 50,
            iconEmoji: "🧮",
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
export function getTopicsForGrade(grade: Grade): StaticTopic[] {
  const gradeEntry = CURRICULUM_TREE.find((g) => g.grade === grade);
  if (!gradeEntry) return [];
  return gradeEntry.strands.flatMap((s) => s.topics);
}

/**
 * Returns a specific topic by its ID.
 */
export function getTopicById(topicId: string): StaticTopic | undefined {
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
export function getPrerequisiteChain(topicId: string): StaticTopic[] {
  const topic = getTopicById(topicId);
  if (!topic || topic.prerequisites.length === 0) return [];

  const prereqs = topic.prerequisites
    .map((pid) => getTopicById(pid))
    .filter((t): t is StaticTopic => t !== undefined);

  return [...prereqs, ...prereqs.flatMap((p) => getPrerequisiteChain(p.id))];
}

// ─── Internal Types ────────────────────────────────────────────────────────────

interface CurriculumGrade {
  grade: Grade;
  strands: CurriculumStrand[];
}

interface CurriculumStrand {
  strand:    Strand;
  topics:    StaticTopic[];
  subtopics: Subtopic[];
}
