/**
 * @module database/seed
 *
 * Idempotent seed script for MathAI.
 * Safe to run multiple times — all writes use upsert.
 *
 * Seeds in this order:
 *   1.  CurriculumStrands   — 9 mathematical strands
 *   2.  Topics              — 30 topics across grades K–8
 *   3.  Lessons             — 2–3 lessons per seeded topic (subset)
 *   4.  PracticeSets        — one practice + one review set per topic
 *   5.  Badges              — full badge catalog (matches BADGE_REGISTRY)
 *   6.  DailyQuests         — 7 daily + 3 weekly quest templates
 *   7.  Dev accounts        — 3 student users (non-production only)
 *
 * Run: pnpm prisma db seed
 * Env: DATABASE_URL must be set
 */

import { PrismaClient } from "@prisma/client";
import type {
  Grade,
  Strand,
  Difficulty,
  BadgeCategory,
  QuestType,
  UserRole,
  PracticeMode,
  LearningPace,
} from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`);
}

// ─── 1. Curriculum Strands ───────────────────────────────────────────────────

const STRANDS: Array<{
  slug: string;
  name: string;
  description: string;
  iconEmoji: string;
  sortOrder: number;
}> = [
  {
    slug: "numbers",
    name: "Number Sense",
    description:
      "Understanding place value, counting, comparing, and ordering numbers — the bedrock of all mathematics.",
    iconEmoji: "🔢",
    sortOrder: 1,
  },
  {
    slug: "operations",
    name: "Operations & Arithmetic",
    description:
      "Addition, subtraction, multiplication, and division — with and without regrouping, across number ranges.",
    iconEmoji: "➕",
    sortOrder: 2,
  },
  {
    slug: "fractions",
    name: "Fractions",
    description:
      "Understanding parts of a whole, equivalent fractions, comparing, adding, subtracting, multiplying, and dividing fractions.",
    iconEmoji: "🥧",
    sortOrder: 3,
  },
  {
    slug: "decimals",
    name: "Decimals & Percentages",
    description:
      "Reading, writing, and operating with decimal numbers; converting between fractions, decimals, and percentages.",
    iconEmoji: "💯",
    sortOrder: 4,
  },
  {
    slug: "geometry",
    name: "Geometry & Spatial Sense",
    description:
      "Properties of 2D and 3D shapes, symmetry, area, perimeter, volume, and coordinate geometry.",
    iconEmoji: "📐",
    sortOrder: 5,
  },
  {
    slug: "measurement",
    name: "Measurement",
    description:
      "Length, mass, capacity, time, temperature — using standard and non-standard units with appropriate tools.",
    iconEmoji: "📏",
    sortOrder: 6,
  },
  {
    slug: "algebra",
    name: "Patterns & Algebra",
    description:
      "Identifying, extending, and creating patterns; introduction to variables, expressions, and equations.",
    iconEmoji: "🔣",
    sortOrder: 7,
  },
  {
    slug: "word-problems",
    name: "Word Problems",
    description:
      "Reading comprehension meets mathematics — translating real-world scenarios into equations and solutions.",
    iconEmoji: "📖",
    sortOrder: 8,
  },
  {
    slug: "data",
    name: "Data & Probability",
    description:
      "Collecting, organising, and interpreting data; introduction to chance and basic probability.",
    iconEmoji: "📊",
    sortOrder: 9,
  },
];

// ─── 2. Topics ────────────────────────────────────────────────────────────────

// Each entry references slug of its parent strand.
const TOPICS: Array<{
  slug: string;
  strandSlug: string;
  name: string;
  description: string;
  gradeBand: string;
  difficulty: string;
  prerequisites: string[];
  masteryThreshold: number;
  estimatedMinutes: number;
  iconEmoji?: string;
  sortOrder: number;
}> = [
  // ─── Number Sense ─────────────────────────────────────────────────────────
  {
    slug: "counting-to-20",
    strandSlug: "numbers",
    name: "Counting to 20",
    description: "Count forwards and backwards from any number within 20; represent quantities with objects and numerals.",
    gradeBand: "K",
    difficulty: "beginner",
    prerequisites: [],
    masteryThreshold: 0.8,
    estimatedMinutes: 20,
    iconEmoji: "🔢",
    sortOrder: 1,
  },
  {
    slug: "place-value-hundreds",
    strandSlug: "numbers",
    name: "Place Value to Hundreds",
    description: "Understand that digits in each place represent amounts of ones, tens, and hundreds.",
    gradeBand: "G2",
    difficulty: "beginner",
    prerequisites: ["counting-to-20"],
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    iconEmoji: "🏛️",
    sortOrder: 2,
  },
  {
    slug: "place-value-thousands",
    strandSlug: "numbers",
    name: "Place Value to Thousands",
    description: "Extend place value understanding to four-digit numbers; compose and decompose using thousands, hundreds, tens, and ones.",
    gradeBand: "G3",
    difficulty: "intermediate",
    prerequisites: ["place-value-hundreds"],
    masteryThreshold: 0.8,
    estimatedMinutes: 35,
    iconEmoji: "🏗️",
    sortOrder: 3,
  },
  {
    slug: "rounding-numbers",
    strandSlug: "numbers",
    name: "Rounding Numbers",
    description: "Round whole numbers to the nearest 10, 100, or 1 000 using number lines and place value understanding.",
    gradeBand: "G3",
    difficulty: "intermediate",
    prerequisites: ["place-value-thousands"],
    masteryThreshold: 0.75,
    estimatedMinutes: 25,
    iconEmoji: "🎯",
    sortOrder: 4,
  },
  {
    slug: "negative-numbers",
    strandSlug: "numbers",
    name: "Negative Numbers",
    description: "Understand and use negative numbers in context (temperature, sea level); order integers on a number line.",
    gradeBand: "G6",
    difficulty: "intermediate",
    prerequisites: ["rounding-numbers"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "🌡️",
    sortOrder: 5,
  },

  // ─── Operations ───────────────────────────────────────────────────────────
  {
    slug: "addition-within-10",
    strandSlug: "operations",
    name: "Addition Within 10",
    description: "Fluently add within 10 using objects, drawings, and number bonds.",
    gradeBand: "K",
    difficulty: "beginner",
    prerequisites: ["counting-to-20"],
    masteryThreshold: 0.9,
    estimatedMinutes: 20,
    iconEmoji: "➕",
    sortOrder: 1,
  },
  {
    slug: "subtraction-within-20",
    strandSlug: "operations",
    name: "Subtraction Within 20",
    description: "Subtract within 20 using strategies like counting back, using ten, and decomposing numbers.",
    gradeBand: "G1",
    difficulty: "beginner",
    prerequisites: ["addition-within-10"],
    masteryThreshold: 0.85,
    estimatedMinutes: 25,
    iconEmoji: "➖",
    sortOrder: 2,
  },
  {
    slug: "multiplication-tables",
    strandSlug: "operations",
    name: "Multiplication Tables (2–10)",
    description: "Build fluency with multiplication facts 2–10 through patterns, arrays, and skip counting.",
    gradeBand: "G3",
    difficulty: "intermediate",
    prerequisites: ["subtraction-within-20"],
    masteryThreshold: 0.9,
    estimatedMinutes: 45,
    iconEmoji: "✖️",
    sortOrder: 3,
  },
  {
    slug: "long-division",
    strandSlug: "operations",
    name: "Long Division",
    description: "Divide multi-digit numbers using the standard long division algorithm; interpret remainders.",
    gradeBand: "G4",
    difficulty: "advanced",
    prerequisites: ["multiplication-tables"],
    masteryThreshold: 0.75,
    estimatedMinutes: 50,
    iconEmoji: "➗",
    sortOrder: 4,
  },
  {
    slug: "order-of-operations",
    strandSlug: "operations",
    name: "Order of Operations (BODMAS)",
    description: "Apply BODMAS/PEMDAS rules to evaluate expressions with multiple operations including brackets.",
    gradeBand: "G5",
    difficulty: "advanced",
    prerequisites: ["long-division"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "🎭",
    sortOrder: 5,
  },

  // ─── Fractions ────────────────────────────────────────────────────────────
  {
    slug: "intro-to-fractions",
    strandSlug: "fractions",
    name: "Introduction to Fractions",
    description: "Understand a fraction as a part of a whole; identify halves, thirds, and quarters using shapes and sets.",
    gradeBand: "G2",
    difficulty: "beginner",
    prerequisites: ["place-value-hundreds"],
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    iconEmoji: "🥧",
    sortOrder: 1,
  },
  {
    slug: "equivalent-fractions",
    strandSlug: "fractions",
    name: "Equivalent Fractions",
    description: "Find and generate equivalent fractions using multiplication and division; simplify fractions to lowest terms.",
    gradeBand: "G4",
    difficulty: "intermediate",
    prerequisites: ["intro-to-fractions"],
    masteryThreshold: 0.8,
    estimatedMinutes: 35,
    iconEmoji: "⚖️",
    sortOrder: 2,
  },
  {
    slug: "adding-fractions",
    strandSlug: "fractions",
    name: "Adding & Subtracting Fractions",
    description: "Add and subtract fractions with like and unlike denominators; simplify results.",
    gradeBand: "G5",
    difficulty: "intermediate",
    prerequisites: ["equivalent-fractions"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "🔂",
    sortOrder: 3,
  },
  {
    slug: "multiplying-fractions",
    strandSlug: "fractions",
    name: "Multiplying & Dividing Fractions",
    description: "Multiply fractions by fractions and whole numbers; divide fractions using the reciprocal method.",
    gradeBand: "G6",
    difficulty: "advanced",
    prerequisites: ["adding-fractions"],
    masteryThreshold: 0.75,
    estimatedMinutes: 45,
    iconEmoji: "🔀",
    sortOrder: 4,
  },

  // ─── Decimals ────────────────────────────────────────────────────────────
  {
    slug: "intro-to-decimals",
    strandSlug: "decimals",
    name: "Introduction to Decimals",
    description: "Read, write, and compare decimals to tenths and hundredths; connect decimals to fractions.",
    gradeBand: "G4",
    difficulty: "beginner",
    prerequisites: ["equivalent-fractions"],
    masteryThreshold: 0.8,
    estimatedMinutes: 35,
    iconEmoji: "🔸",
    sortOrder: 1,
  },
  {
    slug: "decimal-operations",
    strandSlug: "decimals",
    name: "Decimal Operations",
    description: "Add, subtract, multiply, and divide decimals; apply to money and measurement contexts.",
    gradeBand: "G5",
    difficulty: "intermediate",
    prerequisites: ["intro-to-decimals"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "💰",
    sortOrder: 2,
  },
  {
    slug: "percentages",
    strandSlug: "decimals",
    name: "Percentages",
    description: "Convert between fractions, decimals, and percentages; calculate percentages of quantities.",
    gradeBand: "G6",
    difficulty: "intermediate",
    prerequisites: ["decimal-operations"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "💯",
    sortOrder: 3,
  },

  // ─── Geometry ─────────────────────────────────────────────────────────────
  {
    slug: "2d-shapes",
    strandSlug: "geometry",
    name: "2D Shapes & Properties",
    description: "Identify and describe circles, triangles, quadrilaterals, and polygons by sides, angles, and symmetry.",
    gradeBand: "G1",
    difficulty: "beginner",
    prerequisites: [],
    masteryThreshold: 0.8,
    estimatedMinutes: 25,
    iconEmoji: "🔵",
    sortOrder: 1,
  },
  {
    slug: "perimeter-area",
    strandSlug: "geometry",
    name: "Perimeter & Area",
    description: "Calculate perimeter and area of rectangles, triangles, and composite shapes using formulas.",
    gradeBand: "G4",
    difficulty: "intermediate",
    prerequisites: ["2d-shapes"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "📐",
    sortOrder: 2,
  },
  {
    slug: "volume",
    strandSlug: "geometry",
    name: "Volume of 3D Shapes",
    description: "Calculate volume of rectangular prisms, triangular prisms, and cylinders using appropriate formulas.",
    gradeBand: "G6",
    difficulty: "advanced",
    prerequisites: ["perimeter-area"],
    masteryThreshold: 0.75,
    estimatedMinutes: 45,
    iconEmoji: "📦",
    sortOrder: 3,
  },

  // ─── Measurement ─────────────────────────────────────────────────────────
  {
    slug: "measuring-length",
    strandSlug: "measurement",
    name: "Measuring Length",
    description: "Measure and compare lengths using cm, m, and km; convert between units.",
    gradeBand: "G2",
    difficulty: "beginner",
    prerequisites: ["counting-to-20"],
    masteryThreshold: 0.8,
    estimatedMinutes: 25,
    iconEmoji: "📏",
    sortOrder: 1,
  },
  {
    slug: "time-and-clocks",
    strandSlug: "measurement",
    name: "Telling Time & Elapsed Time",
    description: "Read analogue and digital clocks; calculate elapsed time across hours and minutes.",
    gradeBand: "G2",
    difficulty: "intermediate",
    prerequisites: ["measuring-length"],
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    iconEmoji: "🕐",
    sortOrder: 2,
  },

  // ─── Algebra ─────────────────────────────────────────────────────────────
  {
    slug: "number-patterns",
    strandSlug: "algebra",
    name: "Number Patterns & Sequences",
    description: "Identify, describe, and extend number patterns including arithmetic sequences and multiplication patterns.",
    gradeBand: "G3",
    difficulty: "beginner",
    prerequisites: ["multiplication-tables"],
    masteryThreshold: 0.8,
    estimatedMinutes: 25,
    iconEmoji: "🔣",
    sortOrder: 1,
  },
  {
    slug: "intro-to-variables",
    strandSlug: "algebra",
    name: "Introduction to Variables",
    description: "Use letters to represent unknown quantities; write and evaluate simple algebraic expressions.",
    gradeBand: "G6",
    difficulty: "intermediate",
    prerequisites: ["number-patterns", "order-of-operations"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "🔤",
    sortOrder: 2,
  },
  {
    slug: "linear-equations",
    strandSlug: "algebra",
    name: "Solving Linear Equations",
    description: "Solve one- and two-step equations with one unknown; check solutions and interpret in context.",
    gradeBand: "G7",
    difficulty: "advanced",
    prerequisites: ["intro-to-variables"],
    masteryThreshold: 0.75,
    estimatedMinutes: 50,
    iconEmoji: "🧮",
    sortOrder: 3,
  },

  // ─── Word Problems ───────────────────────────────────────────────────────
  {
    slug: "word-problems-addition",
    strandSlug: "word-problems",
    name: "Addition & Subtraction Word Problems",
    description: "Model and solve one- and two-step word problems using addition and subtraction strategies.",
    gradeBand: "G2",
    difficulty: "intermediate",
    prerequisites: ["subtraction-within-20"],
    masteryThreshold: 0.75,
    estimatedMinutes: 30,
    iconEmoji: "📖",
    sortOrder: 1,
  },
  {
    slug: "word-problems-ratio",
    strandSlug: "word-problems",
    name: "Ratio & Proportion Word Problems",
    description: "Solve word problems involving ratios, rates, and proportional relationships.",
    gradeBand: "G6",
    difficulty: "advanced",
    prerequisites: ["percentages", "multiplying-fractions"],
    masteryThreshold: 0.75,
    estimatedMinutes: 45,
    iconEmoji: "🔗",
    sortOrder: 2,
  },

  // ─── Data & Probability ──────────────────────────────────────────────────
  {
    slug: "reading-graphs",
    strandSlug: "data",
    name: "Reading Graphs & Charts",
    description: "Interpret bar graphs, pictographs, line graphs, and pie charts; answer questions from data displays.",
    gradeBand: "G3",
    difficulty: "beginner",
    prerequisites: ["place-value-thousands"],
    masteryThreshold: 0.8,
    estimatedMinutes: 25,
    iconEmoji: "📊",
    sortOrder: 1,
  },
  {
    slug: "mean-median-mode",
    strandSlug: "data",
    name: "Mean, Median, Mode & Range",
    description: "Calculate and interpret measures of central tendency and spread for data sets.",
    gradeBand: "G6",
    difficulty: "intermediate",
    prerequisites: ["reading-graphs"],
    masteryThreshold: 0.8,
    estimatedMinutes: 40,
    iconEmoji: "📈",
    sortOrder: 2,
  },
];

// ─── 3. Lessons (subset — 2 lessons per topic, first 8 topics) ───────────────

type LessonDef = {
  topicSlug: string;
  title: string;
  objective: string;
  contentSummary: string;
  orderIndex: number;
};

const LESSONS: LessonDef[] = [
  // Counting to 20
  {
    topicSlug: "counting-to-20",
    title: "Counting Objects 1–10",
    objective: "Students will count a set of up to 10 objects and write the corresponding numeral.",
    contentSummary: "Use one-to-one correspondence to count objects in a line, array, or scattered arrangement. Touch each object once while saying the number name aloud. The last number spoken is the total.",
    orderIndex: 1,
  },
  {
    topicSlug: "counting-to-20",
    title: "Counting Forwards and Backwards 1–20",
    objective: "Students will count forward from any number to 20 and backward from any number to 1.",
    contentSummary: "Practice counting on from a given starting number rather than always starting from 1. Use a number line to model backward counting. Recognise patterns in the teen numbers (13 = ten and three).",
    orderIndex: 2,
  },
  // Place Value Hundreds
  {
    topicSlug: "place-value-hundreds",
    title: "Hundreds, Tens, and Ones",
    objective: "Students will identify the value of each digit in a three-digit number.",
    contentSummary: "A three-digit number has a hundreds digit, a tens digit, and a ones digit. Use base-ten blocks: flats (100), rods (10), and unit cubes (1). Write expanded form: 347 = 300 + 40 + 7.",
    orderIndex: 1,
  },
  {
    topicSlug: "place-value-hundreds",
    title: "Comparing Three-Digit Numbers",
    objective: "Students will compare two three-digit numbers using <, >, and = symbols.",
    contentSummary: "Compare from left to right, starting with the hundreds digit. If hundreds are equal, move to tens, then ones. Use a number line or place value chart to support reasoning.",
    orderIndex: 2,
  },
  // Multiplication Tables
  {
    topicSlug: "multiplication-tables",
    title: "Understanding Multiplication as Repeated Addition",
    objective: "Students will explain multiplication as repeated addition and model with arrays.",
    contentSummary: "Multiplication is a shortcut for repeated addition: 4 × 3 means 4 groups of 3 = 3+3+3+3. Draw arrays to visualise — 4 rows of 3 dots. Connect to area models for geometric intuition.",
    orderIndex: 1,
  },
  {
    topicSlug: "multiplication-tables",
    title: "Memorising the 2s, 5s, and 10s Tables",
    objective: "Students will recall multiplication facts for 2, 5, and 10 with automaticity.",
    contentSummary: "The 2s table follows an even-number skip pattern (2,4,6,8…). The 5s end in 0 or 5. The 10s just add a zero. Use skip-count songs and rapid flashcard drills to build automaticity.",
    orderIndex: 2,
  },
  // Equivalent Fractions
  {
    topicSlug: "equivalent-fractions",
    title: "Finding Equivalent Fractions",
    objective: "Students will generate equivalent fractions by multiplying or dividing numerator and denominator by the same number.",
    contentSummary: "Equivalent fractions name the same amount. Multiply or divide both parts by the same non-zero number: 1/2 = 2/4 = 4/8. Use fraction bars or area models to verify visually.",
    orderIndex: 1,
  },
  {
    topicSlug: "equivalent-fractions",
    title: "Simplifying Fractions to Lowest Terms",
    objective: "Students will simplify fractions to their simplest form using the greatest common factor.",
    contentSummary: "Find the GCF of numerator and denominator. Divide both by the GCF. Check: 12/18 → GCF is 6 → 2/3. A fraction is fully simplified when numerator and denominator share no common factor other than 1.",
    orderIndex: 2,
  },
  // Perimeter and Area
  {
    topicSlug: "perimeter-area",
    title: "Perimeter of Polygons",
    objective: "Students will calculate the perimeter of rectangles, triangles, and irregular polygons.",
    contentSummary: "Perimeter is the total distance around a shape — add the length of all sides. For rectangles: P = 2(l + w). For irregular shapes, add each side individually. Always label with the correct unit (cm, m).",
    orderIndex: 1,
  },
  {
    topicSlug: "perimeter-area",
    title: "Area of Rectangles and Triangles",
    objective: "Students will calculate area using A = l × w for rectangles and A = ½bh for triangles.",
    contentSummary: "Area measures how many square units fill a shape. Rectangles: count square tiles or use A = l × w. Triangles are half of a parallelogram: A = ½ × base × height. Area is measured in square units (cm², m²).",
    orderIndex: 2,
  },
  // Reading Graphs
  {
    topicSlug: "reading-graphs",
    title: "Reading Bar Graphs",
    objective: "Students will read and interpret bar graphs to answer comparison and total questions.",
    contentSummary: "A bar graph uses bars of different heights to show quantities. Read the scale on the vertical axis first. The longer the bar, the greater the value. To compare, look at bar heights side by side.",
    orderIndex: 1,
  },
  {
    topicSlug: "reading-graphs",
    title: "Reading Line Graphs",
    objective: "Students will interpret line graphs to identify trends and read values at specific points.",
    contentSummary: "Line graphs show change over time. Find a point on the x-axis (time), trace up to the line, then across to read the y-value. Rising lines show increase; falling lines show decrease.",
    orderIndex: 2,
  },
];

// ─── 4. Badges ────────────────────────────────────────────────────────────────

const BADGES: Array<{
  code: string;
  title: string;
  description: string;
  iconUrl: string;
  category: string;
  xpReward: number;
}> = [
  // Accuracy
  {
    code: "badge-perfect-score",
    title: "Perfect Score!",
    description: "Got every question right in a practice session.",
    iconUrl: "/badges/perfect-score.svg",
    category: "accuracy",
    xpReward: 30,
  },
  {
    code: "badge-flying-solo",
    title: "Flying Solo",
    description: "Completed a full session without using any hints.",
    iconUrl: "/badges/flying-solo.svg",
    category: "accuracy",
    xpReward: 20,
  },
  {
    code: "badge-topic-conqueror",
    title: "Topic Conqueror",
    description: "Achieved Mastered status on any topic.",
    iconUrl: "/badges/topic-conqueror.svg",
    category: "accuracy",
    xpReward: 50,
  },
  // Streak
  {
    code: "badge-streak-3",
    title: "On a Roll",
    description: "Practised 3 days in a row!",
    iconUrl: "/badges/streak-3.svg",
    category: "streak",
    xpReward: 15,
  },
  {
    code: "badge-streak-7",
    title: "Week Warrior",
    description: "7-day streak! A full week of math mastery.",
    iconUrl: "/badges/streak-7.svg",
    category: "streak",
    xpReward: 25,
  },
  {
    code: "badge-streak-14",
    title: "Fortnight Fighter",
    description: "14 days in a row! Two solid weeks of math.",
    iconUrl: "/badges/streak-14.svg",
    category: "streak",
    xpReward: 40,
  },
  {
    code: "badge-streak-30",
    title: "Month Master",
    description: "30 days straight! You're unstoppable.",
    iconUrl: "/badges/streak-30.svg",
    category: "streak",
    xpReward: 75,
  },
  {
    code: "badge-streak-100",
    title: "Centurion",
    description: "100 days! You are a true Math Champion.",
    iconUrl: "/badges/streak-100.svg",
    category: "streak",
    xpReward: 200,
  },
  // Speed
  {
    code: "badge-speedster",
    title: "Speedster",
    description: "Completed a challenge session in under 60 seconds per question on average.",
    iconUrl: "/badges/speedster.svg",
    category: "speed",
    xpReward: 25,
  },
  // Persistence
  {
    code: "badge-comeback-kid",
    title: "Comeback Kid",
    description: "Got a question wrong first attempt but came back and nailed it.",
    iconUrl: "/badges/comeback-kid.svg",
    category: "persistence",
    xpReward: 15,
  },
  // Exploration
  {
    code: "badge-explorer",
    title: "Math Explorer",
    description: "Attempted questions from 5 different topics in a single week.",
    iconUrl: "/badges/explorer.svg",
    category: "exploration",
    xpReward: 20,
  },
  {
    code: "badge-extended-mastery",
    title: "Extended Mastery",
    description: "Reached Extended mastery level (≥ 90 % accuracy) on a topic.",
    iconUrl: "/badges/extended-mastery.svg",
    category: "accuracy",
    xpReward: 100,
  },
];

// ─── 5. Quest Templates ───────────────────────────────────────────────────────

const QUESTS: Array<{
  title: string;
  description: string;
  xpReward: number;
  questType: string;
  difficulty: string;
  targetValue: number;
  trackingKey: string;
}> = [
  // Daily
  {
    title: "Answer 5 Questions Correctly",
    description: "Get 5 answers right today across any topic.",
    xpReward: 20,
    questType: "daily",
    difficulty: "beginner",
    targetValue: 5,
    trackingKey: "correct_answers",
  },
  {
    title: "Practise for 10 Minutes",
    description: "Spend at least 10 minutes practising today.",
    xpReward: 15,
    questType: "daily",
    difficulty: "beginner",
    targetValue: 10,
    trackingKey: "minutes_practiced",
  },
  {
    title: "Complete a Full Practice Set",
    description: "Finish one complete practice set from start to finish.",
    xpReward: 25,
    questType: "daily",
    difficulty: "intermediate",
    targetValue: 1,
    trackingKey: "sessions_completed",
  },
  {
    title: "Answer 10 Correctly in a Row",
    description: "Get 10 correct answers without a wrong answer in between.",
    xpReward: 40,
    questType: "daily",
    difficulty: "advanced",
    targetValue: 10,
    trackingKey: "correct_streak",
  },
  {
    title: "Try a New Topic",
    description: "Attempt at least one question in a topic you haven't practised before.",
    xpReward: 20,
    questType: "daily",
    difficulty: "beginner",
    targetValue: 1,
    trackingKey: "new_topics_attempted",
  },
  {
    title: "No Hints Today",
    description: "Complete a full session without using any hints.",
    xpReward: 30,
    questType: "daily",
    difficulty: "advanced",
    targetValue: 1,
    trackingKey: "hintless_sessions",
  },
  {
    title: "Log In Today",
    description: "Simply show up! Open MathAI and complete at least one question.",
    xpReward: 5,
    questType: "daily",
    difficulty: "beginner",
    targetValue: 1,
    trackingKey: "daily_login",
  },
  // Weekly
  {
    title: "Master a Topic This Week",
    description: "Reach Mastered status (≥ 80 % accuracy) on any topic by Sunday.",
    xpReward: 100,
    questType: "weekly",
    difficulty: "advanced",
    targetValue: 1,
    trackingKey: "topics_mastered",
  },
  {
    title: "Answer 50 Questions This Week",
    description: "Answer at least 50 questions across any topics this week.",
    xpReward: 75,
    questType: "weekly",
    difficulty: "intermediate",
    targetValue: 50,
    trackingKey: "correct_answers",
  },
  {
    title: "Practise 5 Different Topics This Week",
    description: "Spread your practice! Attempt questions in 5 different topics this week.",
    xpReward: 60,
    questType: "weekly",
    difficulty: "intermediate",
    targetValue: 5,
    trackingKey: "topics_attempted",
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 MathAI seed starting...\n");

  // ── Step 1: Strands ──────────────────────────────────────────────────────
  console.log("▶ Seeding curriculum strands...");
  const strandIdMap: Record<string, string> = {};
  for (const s of STRANDS) {
    const record = await prisma.curriculumStrand.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, iconEmoji: s.iconEmoji, sortOrder: s.sortOrder },
      create: { slug: s.slug, name: s.name, description: s.description, iconEmoji: s.iconEmoji, sortOrder: s.sortOrder },
    });
    strandIdMap[s.slug] = record.id;
  }
  log(`✅ ${STRANDS.length} strands`);

  // ── Step 2: Topics ───────────────────────────────────────────────────────
  console.log("▶ Seeding topics...");
  const topicIdMap: Record<string, string> = {};
  for (const t of TOPICS) {
    const strandId = strandIdMap[t.strandSlug];
    if (!strandId) throw new Error(`Unknown strandSlug: ${t.strandSlug}`);
    const record = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {
        strandId,
        name: t.name,
        description: t.description,
        gradeBand: t.gradeBand as Grade,
        difficulty: t.difficulty as Difficulty,
        prerequisites: t.prerequisites,
        masteryThreshold: t.masteryThreshold,
        estimatedMinutes: t.estimatedMinutes,
        iconEmoji: t.iconEmoji ?? null,
        sortOrder: t.sortOrder,
      },
      create: {
        strandId,
        slug: t.slug,
        name: t.name,
        description: t.description,
        gradeBand: t.gradeBand as Grade,
        difficulty: t.difficulty as Difficulty,
        prerequisites: t.prerequisites,
        masteryThreshold: t.masteryThreshold,
        estimatedMinutes: t.estimatedMinutes,
        iconEmoji: t.iconEmoji ?? null,
        sortOrder: t.sortOrder,
      },
    });
    topicIdMap[t.slug] = record.id;
  }
  log(`✅ ${TOPICS.length} topics`);

  // ── Step 3: Lessons ──────────────────────────────────────────────────────
  console.log("▶ Seeding lessons...");
  let lessonCount = 0;
  const lessonIdByTopicSlugAndOrder: Record<string, string> = {};
  for (const l of LESSONS) {
    const topicId = topicIdMap[l.topicSlug];
    if (!topicId) throw new Error(`Unknown topicSlug: ${l.topicSlug}`);
    // Upsert by composite of topicId + orderIndex via findFirst + create
    const existing = await prisma.lesson.findFirst({
      where: { topicId, orderIndex: l.orderIndex },
    });
    let record;
    if (existing) {
      record = await prisma.lesson.update({
        where: { id: existing.id },
        data: { title: l.title, objective: l.objective, contentSummary: l.contentSummary },
      });
    } else {
      record = await prisma.lesson.create({
        data: { topicId, title: l.title, objective: l.objective, contentSummary: l.contentSummary, orderIndex: l.orderIndex },
      });
    }
    lessonIdByTopicSlugAndOrder[`${l.topicSlug}:${l.orderIndex}`] = record.id;
    lessonCount++;
  }
  log(`✅ ${lessonCount} lessons`);

  // ── Step 4: Practice Sets (one per topic) ─────────────────────────────────
  console.log("▶ Seeding practice sets...");
  let setCount = 0;
  for (const t of TOPICS) {
    const topicId = topicIdMap[t.slug];
    const firstLessonId = lessonIdByTopicSlugAndOrder[`${t.slug}:1`];
    // Practice set
    await prisma.practiceSet.upsert({
      where: { id: `pset-practice-${t.slug}` },
      update: {},
      create: {
        id: `pset-practice-${t.slug}`,
        topicId,
        lessonId: firstLessonId ?? null,
        title: `${t.name} — Practice`,
        mode: "practice" as PracticeMode,
        difficulty: t.difficulty as Difficulty,
        questionCount: 10,
      },
    });
    // Review set (topic-level, no lesson)
    await prisma.practiceSet.upsert({
      where: { id: `pset-review-${t.slug}` },
      update: {},
      create: {
        id: `pset-review-${t.slug}`,
        topicId,
        lessonId: null,
        title: `${t.name} — Review`,
        mode: "review" as PracticeMode,
        difficulty: t.difficulty as Difficulty,
        questionCount: 5,
      },
    });
    setCount += 2;
  }
  log(`✅ ${setCount} practice sets`);

  // ── Step 5: Badges ────────────────────────────────────────────────────────
  console.log("▶ Seeding badges...");
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: { title: b.title, description: b.description, iconUrl: b.iconUrl, xpReward: b.xpReward },
      create: {
        code: b.code,
        title: b.title,
        description: b.description,
        iconUrl: b.iconUrl,
        category: b.category as BadgeCategory,
        xpReward: b.xpReward,
      },
    });
  }
  log(`✅ ${BADGES.length} badges`);

  // ── Step 6: Quest Templates ───────────────────────────────────────────────
  console.log("▶ Seeding quest templates...");
  for (const q of QUESTS) {
    const existing = await prisma.dailyQuest.findFirst({
      where: { trackingKey: q.trackingKey, questType: q.questType as QuestType, title: q.title },
    });
    if (!existing) {
      await prisma.dailyQuest.create({
        data: {
          title: q.title,
          description: q.description,
          xpReward: q.xpReward,
          questType: q.questType as QuestType,
          difficulty: q.difficulty as Difficulty,
          targetValue: q.targetValue,
          trackingKey: q.trackingKey,
        },
      });
    }
  }
  log(`✅ ${QUESTS.length} quest templates`);

  // ── Step 7: Dev accounts (non-production only) ────────────────────────────
  if (process.env["NODE_ENV"] !== "production") {
    console.log("▶ Seeding dev accounts (non-production)...");

    const devUsers = [
      { email: "alice@mathai.test", name: "Alice (Grade 4)", gradeLevel: "G4", xp: 850, level: 4, streak: 7 },
      { email: "bob@mathai.test",   name: "Bob (Grade 6)",   gradeLevel: "G6", xp: 250, level: 2, streak: 2 },
      { email: "dev@mathai.test",   name: "Dev Student",     gradeLevel: "G4", xp: 0,   level: 1, streak: 0 },
    ];

    for (const u of devUsers) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, gradeLevel: u.gradeLevel as Grade },
        create: {
          email: u.email,
          name: u.name,
          role: "student" as UserRole,
          gradeLevel: u.gradeLevel as Grade,
        },
      });

      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: { totalXp: u.xp, currentLevel: u.level, streakCount: u.streak },
        create: {
          userId: user.id,
          totalXp: u.xp,
          currentLevel: u.level,
          streakCount: u.streak,
          learningPace: "standard" as LearningPace,
          confidenceLevel: 60,
          preferredTheme: "space",
        },
      });

      await prisma.streak.upsert({
        where: { userId: user.id },
        update: { currentStreak: u.streak },
        create: {
          userId: user.id,
          currentStreak: u.streak,
          longestStreak: u.streak,
          lastActiveDate: u.streak > 0 ? new Date() : null,
        },
      });

      // Unlock and set progress on a few topics for Alice
      if (u.email === "alice@mathai.test") {
        const aliceTopics = [
          { slug: "counting-to-20",    masteryScore: 0.95, accuracyRate: 0.95, isMastered: true  },
          { slug: "place-value-hundreds", masteryScore: 0.85, accuracyRate: 0.87, isMastered: true  },
          { slug: "multiplication-tables", masteryScore: 0.72, accuracyRate: 0.74, isMastered: false },
          { slug: "equivalent-fractions",  masteryScore: 0.45, accuracyRate: 0.48, isMastered: false },
        ];
        for (const tp of aliceTopics) {
          const topicId = topicIdMap[tp.slug];
          if (!topicId) continue;
          await prisma.topicProgress.upsert({
            where: { userId_topicId: { userId: user.id, topicId } },
            update: { masteryScore: tp.masteryScore, accuracyRate: tp.accuracyRate, isMastered: tp.isMastered, isUnlocked: true, completionPercent: tp.isMastered ? 1.0 : 0.6, lastPracticedAt: new Date() },
            create: { userId: user.id, topicId, masteryScore: tp.masteryScore, accuracyRate: tp.accuracyRate, isMastered: tp.isMastered, isUnlocked: true, completionPercent: tp.isMastered ? 1.0 : 0.6, lastPracticedAt: new Date() },
          });
        }

        // Award Alice a couple of badges
        const badgeCodes = ["badge-streak-7", "badge-perfect-score"];
        for (const code of badgeCodes) {
          const badge = await prisma.badge.findUnique({ where: { code } });
          if (badge) {
            await prisma.studentBadge.upsert({
              where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
              update: {},
              create: { userId: user.id, badgeId: badge.id },
            });
          }
        }
      }
    }
    log(`✅ ${devUsers.length} dev accounts`);
  }

  console.log("\n🎉 Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
