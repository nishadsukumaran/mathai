/**
 * @module curriculum/topic_tree
 *
 * Cambridge Primary & Lower Secondary Mathematics — authoritative topic tree.
 *
 * FRAMEWORK ALIGNMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *   Grade 1  = Cambridge Primary Stage 1  (ages 5–6)
 *   Grade 2  = Cambridge Primary Stage 2  (ages 6–7)
 *   Grade 3  = Cambridge Primary Stage 3  (ages 7–8)
 *   Grade 4  = Cambridge Primary Stage 4  (ages 8–9)
 *   Grade 5  = Cambridge Primary Stage 5  (ages 9–10)
 *   Grade 6  = Cambridge Primary Stage 6  (ages 10–11)
 *   Grade 7  = Cambridge Lower Secondary Stage 7 (ages 11–12)
 *   Grade 8  = Cambridge Lower Secondary Stage 8 (ages 12–13)
 *
 * STRANDS (mapped to MathAI Strand enum)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Numbers           → Number (counting, place value, integers, primes)
 *   Operations        → Number (arithmetic operations)
 *   Fractions         → Number (fractions, ratio, proportion)
 *   Decimals          → Number (decimals, percentages)
 *   Algebra           → Algebra
 *   Geometry          → Geometry & Measure
 *   Measurement       → Geometry & Measure
 *   DataAndProbability → Statistics & Probability
 *   WordProblems      → Cross-strand applied problems
 *
 * MASTERY THRESHOLD GUIDE
 * ─────────────────────────────────────────────────────────────────────────────
 *   0.85  — foundational skills (must be solid before progressing)
 *   0.80  — standard curriculum topics
 *   0.75  — complex / abstract topics where 75% is acceptable progress
 *
 * cambridgeObjective — the specific Cambridge framework learning objective code
 *   that this topic maps to. Used in the AI question generator system prompt to
 *   ensure generated questions align with the Cambridge syllabus.
 */

import { Grade, Strand } from "@/types";

// ─── Local Types ────────────────────────────────────────────────────────────────

export interface StaticTopic {
  id:                 string;
  slug:               string;
  name:               string;
  strand:             Strand;
  grade:              Grade;
  description:        string;
  cambridgeObjective: string;   // Cambridge framework reference + descriptor
  prerequisites:      string[];
  masteryThreshold:   number;
  estimatedMinutes:   number;
  iconEmoji?:         string;
}

interface CurriculumGrade {
  grade:   Grade;
  strands: CurriculumStrand[];
}

interface CurriculumStrand {
  strand:    Strand;
  topics:    StaticTopic[];
  subtopics: unknown[];
}

// ─── Curriculum Tree ────────────────────────────────────────────────────────────

export const CURRICULUM_TREE: CurriculumGrade[] = [

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 1 — Cambridge Primary Stage 1 (ages 5–6)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G1,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g1-num-counting",
            slug: "counting-to-100",
            name: "Counting to 100",
            strand: Strand.Numbers,
            grade: Grade.G1,
            description: "Count, read, and write numbers to 100; count on and back in 1s",
            cambridgeObjective: "1Nc.01 — Count objects from 0 to 20; count on or back in ones, twos, fives or tens",
            prerequisites: [],
            masteryThreshold: 0.85,
            estimatedMinutes: 25,
            iconEmoji: "🔢",
          },
          {
            id: "g1-num-place-value",
            slug: "place-value-tens-ones",
            name: "Place Value: Tens and Ones",
            strand: Strand.Numbers,
            grade: Grade.G1,
            description: "Understand tens and ones; compose and decompose 2-digit numbers",
            cambridgeObjective: "1Np.01 — Understand that the position of a digit gives its value",
            prerequisites: ["g1-num-counting"],
            masteryThreshold: 0.85,
            estimatedMinutes: 30,
            iconEmoji: "🏗️",
          },
          {
            id: "g1-num-number-bonds",
            slug: "number-bonds-to-10",
            name: "Number Bonds to 10",
            strand: Strand.Numbers,
            grade: Grade.G1,
            description: "Recognise pairs of numbers that total 10; use bonds to add and subtract",
            cambridgeObjective: "1Ni.04 — Know all number bonds for totals to 10",
            prerequisites: ["g1-num-counting"],
            masteryThreshold: 0.85,
            estimatedMinutes: 20,
            iconEmoji: "🔗",
          },
        ],
      },
      {
        strand: Strand.Operations,
        subtopics: [],
        topics: [
          {
            id: "g1-ops-addition",
            slug: "addition-to-20",
            name: "Addition to 20",
            strand: Strand.Operations,
            grade: Grade.G1,
            description: "Add numbers with sums up to 20 using objects, pictures, and number lines",
            cambridgeObjective: "1Ni.05 — Add and subtract single-digit numbers, totals up to 20",
            prerequisites: ["g1-num-number-bonds"],
            masteryThreshold: 0.85,
            estimatedMinutes: 30,
            iconEmoji: "➕",
          },
          {
            id: "g1-ops-subtraction",
            slug: "subtraction-to-20",
            name: "Subtraction to 20",
            strand: Strand.Operations,
            grade: Grade.G1,
            description: "Subtract numbers within 20; understand subtraction as taking away and difference",
            cambridgeObjective: "1Ni.05 — Add and subtract single-digit numbers, totals up to 20",
            prerequisites: ["g1-ops-addition"],
            masteryThreshold: 0.85,
            estimatedMinutes: 30,
            iconEmoji: "➖",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g1-geo-2d-shapes",
            slug: "2d-shapes",
            name: "2D Shapes",
            strand: Strand.Geometry,
            grade: Grade.G1,
            description: "Identify, name, and describe circles, squares, rectangles, and triangles",
            cambridgeObjective: "1Gg.01 — Identify, describe, sort and classify 2D shapes",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 20,
            iconEmoji: "🔷",
          },
          {
            id: "g1-geo-3d-shapes",
            slug: "3d-shapes",
            name: "3D Shapes",
            strand: Strand.Geometry,
            grade: Grade.G1,
            description: "Identify and name cubes, cuboids, spheres, cylinders, and cones",
            cambridgeObjective: "1Gg.02 — Identify, describe, sort and classify 3D shapes",
            prerequisites: ["g1-geo-2d-shapes"],
            masteryThreshold: 0.80,
            estimatedMinutes: 20,
            iconEmoji: "📦",
          },
        ],
      },
      {
        strand: Strand.Measurement,
        subtopics: [],
        topics: [
          {
            id: "g1-meas-comparing",
            slug: "comparing-length-mass",
            name: "Comparing Length and Mass",
            strand: Strand.Measurement,
            grade: Grade.G1,
            description: "Compare and order objects by length, height, and mass using vocabulary: longer, shorter, heavier, lighter",
            cambridgeObjective: "1Gg.06 — Compare and order objects, using appropriate language",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 20,
            iconEmoji: "⚖️",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 2 — Cambridge Primary Stage 2 (ages 6–7)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G2,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g2-num-place-value",
            slug: "place-value-to-100",
            name: "Place Value to 100",
            strand: Strand.Numbers,
            grade: Grade.G2,
            description: "Read, write, and order numbers to 100; understand tens and ones",
            cambridgeObjective: "2Np.01 — Understand the value of each digit in a two-digit number",
            prerequisites: [],
            masteryThreshold: 0.85,
            estimatedMinutes: 30,
            iconEmoji: "💯",
          },
          {
            id: "g2-num-counting-patterns",
            slug: "counting-in-2s-5s-10s",
            name: "Counting in 2s, 5s and 10s",
            strand: Strand.Numbers,
            grade: Grade.G2,
            description: "Count on and back in steps of 2, 5, and 10 from any number",
            cambridgeObjective: "2Nc.03 — Count on and back in twos, fives and tens",
            prerequisites: ["g2-num-place-value"],
            masteryThreshold: 0.80,
            estimatedMinutes: 25,
            iconEmoji: "🔢",
          },
        ],
      },
      {
        strand: Strand.Operations,
        subtopics: [],
        topics: [
          {
            id: "g2-ops-addition",
            slug: "addition-to-100",
            name: "Addition to 100",
            strand: Strand.Operations,
            grade: Grade.G2,
            description: "Add 2-digit numbers with and without regrouping; mental and written strategies",
            cambridgeObjective: "2Ni.04 — Add and subtract two-digit numbers",
            prerequisites: ["g2-num-place-value"],
            masteryThreshold: 0.85,
            estimatedMinutes: 35,
            iconEmoji: "➕",
          },
          {
            id: "g2-ops-subtraction",
            slug: "subtraction-to-100",
            name: "Subtraction to 100",
            strand: Strand.Operations,
            grade: Grade.G2,
            description: "Subtract 2-digit numbers with and without regrouping",
            cambridgeObjective: "2Ni.04 — Add and subtract two-digit numbers",
            prerequisites: ["g2-ops-addition"],
            masteryThreshold: 0.85,
            estimatedMinutes: 35,
            iconEmoji: "➖",
          },
          {
            id: "g2-ops-multiplication-intro",
            slug: "multiplication-2-5-10",
            name: "Multiplication: 2×, 5× and 10× Tables",
            strand: Strand.Operations,
            grade: Grade.G2,
            description: "Understand multiplication as repeated addition; learn 2×, 5×, and 10× tables",
            cambridgeObjective: "2Ni.05 — Understand multiplication as repeated addition; know 2, 5 and 10 multiplication tables",
            prerequisites: ["g2-ops-addition"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "✖️",
          },
        ],
      },
      {
        strand: Strand.Fractions,
        subtopics: [],
        topics: [
          {
            id: "g2-frac-halves-quarters",
            slug: "halves-quarters-thirds",
            name: "Halves, Quarters and Thirds",
            strand: Strand.Fractions,
            grade: Grade.G2,
            description: "Identify and find halves (1/2), quarters (1/4), and thirds (1/3) of shapes and sets",
            cambridgeObjective: "2Nf.01 — Understand that a fraction is part of a whole; recognise 1/2, 1/4 and 1/3",
            prerequisites: ["g2-num-place-value"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🥧",
          },
        ],
      },
      {
        strand: Strand.Measurement,
        subtopics: [],
        topics: [
          {
            id: "g2-meas-length",
            slug: "measuring-length",
            name: "Measuring Length (cm and m)",
            strand: Strand.Measurement,
            grade: Grade.G2,
            description: "Measure and compare lengths using centimetres and metres; estimate lengths",
            cambridgeObjective: "2Gg.06 — Measure and compare lengths in centimetres and metres",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 25,
            iconEmoji: "📏",
          },
          {
            id: "g2-meas-money",
            slug: "money-coins-notes",
            name: "Money — Coins and Notes",
            strand: Strand.Measurement,
            grade: Grade.G2,
            description: "Recognise and use money; add amounts and calculate change",
            cambridgeObjective: "2Gg.08 — Recognise, compare, and use coins and notes",
            prerequisites: ["g2-ops-addition"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "💰",
          },
          {
            id: "g2-meas-time",
            slug: "telling-time",
            name: "Telling Time (Hours and Half Hours)",
            strand: Strand.Measurement,
            grade: Grade.G2,
            description: "Read analogue and digital clocks to the hour and half hour; understand days, weeks, months",
            cambridgeObjective: "2Gg.07 — Tell the time to the hour and half-hour on analogue and digital clocks",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 25,
            iconEmoji: "🕐",
          },
        ],
      },
      {
        strand: Strand.DataAndProbability,
        subtopics: [],
        topics: [
          {
            id: "g2-data-pictograms",
            slug: "pictograms-and-tallies",
            name: "Pictograms and Tally Charts",
            strand: Strand.DataAndProbability,
            grade: Grade.G2,
            description: "Collect data and represent it using tally charts and pictograms; answer questions about data",
            cambridgeObjective: "2Ss.01 — Record, organise, and represent data using tally charts and pictograms",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 25,
            iconEmoji: "📊",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 3 — Cambridge Primary Stage 3 (ages 7–8)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G3,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g3-num-place-value",
            slug: "place-value-to-1000",
            name: "Place Value to 1000",
            strand: Strand.Numbers,
            grade: Grade.G3,
            description: "Read, write, order, and compare 3-digit numbers; understand hundreds, tens, and ones",
            cambridgeObjective: "3Np.01 — Understand the value of each digit in a three-digit number",
            prerequisites: [],
            masteryThreshold: 0.85,
            estimatedMinutes: 30,
            iconEmoji: "🏛️",
          },
          {
            id: "g3-num-negative",
            slug: "negative-numbers-intro",
            name: "Introduction to Negative Numbers",
            strand: Strand.Numbers,
            grade: Grade.G3,
            description: "Understand and use negative numbers in context (temperature, number lines)",
            cambridgeObjective: "3Ni.01 — Recognise and use negative numbers in context",
            prerequisites: ["g3-num-place-value"],
            masteryThreshold: 0.75,
            estimatedMinutes: 25,
            iconEmoji: "🌡️",
          },
        ],
      },
      {
        strand: Strand.Operations,
        subtopics: [],
        topics: [
          {
            id: "g3-ops-addition",
            slug: "addition-to-1000",
            name: "Addition to 1000",
            strand: Strand.Operations,
            grade: Grade.G3,
            description: "Add 3-digit numbers with regrouping using written and mental methods",
            cambridgeObjective: "3Ni.04 — Estimate and add whole numbers up to 1000",
            prerequisites: ["g3-num-place-value"],
            masteryThreshold: 0.85,
            estimatedMinutes: 35,
            iconEmoji: "➕",
          },
          {
            id: "g3-ops-subtraction",
            slug: "subtraction-to-1000",
            name: "Subtraction to 1000",
            strand: Strand.Operations,
            grade: Grade.G3,
            description: "Subtract 3-digit numbers with regrouping; check with addition",
            cambridgeObjective: "3Ni.04 — Estimate and subtract whole numbers up to 1000",
            prerequisites: ["g3-ops-addition"],
            masteryThreshold: 0.85,
            estimatedMinutes: 35,
            iconEmoji: "➖",
          },
          {
            id: "g3-ops-multiplication",
            slug: "multiplication-tables-2-10",
            name: "Multiplication Tables (2–10)",
            strand: Strand.Operations,
            grade: Grade.G3,
            description: "Know multiplication tables for 2–10; multiply by 1-digit numbers",
            cambridgeObjective: "3Ni.05 — Know multiplication tables for 2–10; multiply single-digit numbers",
            prerequisites: ["g3-ops-addition"],
            masteryThreshold: 0.85,
            estimatedMinutes: 45,
            iconEmoji: "✖️",
          },
          {
            id: "g3-ops-division",
            slug: "division-basic",
            name: "Division — Basic",
            strand: Strand.Operations,
            grade: Grade.G3,
            description: "Divide whole numbers by 1-digit divisors; relate to multiplication tables",
            cambridgeObjective: "3Ni.06 — Understand division as the inverse of multiplication",
            prerequisites: ["g3-ops-multiplication"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "➗",
          },
        ],
      },
      {
        strand: Strand.Fractions,
        subtopics: [],
        topics: [
          {
            id: "g3-frac-unit-fractions",
            slug: "unit-fractions",
            name: "Unit Fractions",
            strand: Strand.Fractions,
            grade: Grade.G3,
            description: "Identify and represent unit fractions; find fractions of amounts",
            cambridgeObjective: "3Nf.01 — Recognise and name unit fractions; find fractions of amounts",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🍕",
          },
          {
            id: "g3-frac-equivalent",
            slug: "equivalent-fractions-intro",
            name: "Equivalent Fractions",
            strand: Strand.Fractions,
            grade: Grade.G3,
            description: "Identify and generate equivalent fractions; simplify fractions using multiplication and division",
            cambridgeObjective: "3Nf.02 — Identify equivalent fractions and simplify fractions",
            prerequisites: ["g3-frac-unit-fractions"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "🔄",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g3-geo-angles",
            slug: "angles-right-acute-obtuse",
            name: "Angles: Right, Acute and Obtuse",
            strand: Strand.Geometry,
            grade: Grade.G3,
            description: "Identify and classify angles as right, acute, or obtuse; recognise angles in shapes",
            cambridgeObjective: "3Gg.04 — Classify angles as right, acute or obtuse",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 25,
            iconEmoji: "📐",
          },
          {
            id: "g3-geo-shapes-classification",
            slug: "classifying-2d-shapes",
            name: "Classifying 2D Shapes",
            strand: Strand.Geometry,
            grade: Grade.G3,
            description: "Classify triangles and quadrilaterals by properties; identify lines of symmetry",
            cambridgeObjective: "3Gg.01 — Classify and describe 2D shapes including triangles and quadrilaterals",
            prerequisites: ["g3-geo-angles"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🔷",
          },
        ],
      },
      {
        strand: Strand.Measurement,
        subtopics: [],
        topics: [
          {
            id: "g3-meas-perimeter",
            slug: "perimeter",
            name: "Perimeter",
            strand: Strand.Measurement,
            grade: Grade.G3,
            description: "Calculate the perimeter of rectilinear shapes; measure sides and add them",
            cambridgeObjective: "3Gg.07 — Measure and calculate the perimeter of shapes",
            prerequisites: ["g3-num-place-value"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "📐",
          },
          {
            id: "g3-meas-time",
            slug: "time-calculations",
            name: "Time Calculations",
            strand: Strand.Measurement,
            grade: Grade.G3,
            description: "Read time to 5-minute intervals; calculate elapsed time; convert between hours and minutes",
            cambridgeObjective: "3Gg.08 — Read and record time; calculate time intervals",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🕐",
          },
        ],
      },
      {
        strand: Strand.DataAndProbability,
        subtopics: [],
        topics: [
          {
            id: "g3-data-bar-charts",
            slug: "bar-charts",
            name: "Bar Charts and Frequency Tables",
            strand: Strand.DataAndProbability,
            grade: Grade.G3,
            description: "Collect data, create and read bar charts and frequency tables",
            cambridgeObjective: "3Ss.01 — Collect, organise, and represent data using bar charts and tables",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 25,
            iconEmoji: "📊",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 4 — Cambridge Primary Stage 4 (ages 8–9)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G4,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g4-num-place-value",
            slug: "place-value-to-10000",
            name: "Place Value to 10,000",
            strand: Strand.Numbers,
            grade: Grade.G4,
            description: "Read, write, order, and compare numbers up to 10,000; round to nearest 10, 100, 1000",
            cambridgeObjective: "4Np.01 — Understand and use place value in four-digit numbers; round numbers",
            prerequisites: [],
            masteryThreshold: 0.85,
            estimatedMinutes: 30,
            iconEmoji: "🔢",
          },
          {
            id: "g4-num-multiples-factors",
            slug: "multiples-and-factors",
            name: "Multiples and Factors",
            strand: Strand.Numbers,
            grade: Grade.G4,
            description: "Identify multiples and factors of numbers; recognise common factors",
            cambridgeObjective: "4Ni.02 — Identify and list multiples and factors; find common factors",
            prerequisites: ["g4-num-place-value"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "🔗",
          },
        ],
      },
      {
        strand: Strand.Operations,
        subtopics: [],
        topics: [
          {
            id: "g4-ops-multiplication",
            slug: "multiplication-2digit",
            name: "Multiplying 2-Digit Numbers",
            strand: Strand.Operations,
            grade: Grade.G4,
            description: "Multiply 2- and 3-digit numbers by 1-digit numbers using formal written methods",
            cambridgeObjective: "4Ni.05 — Multiply two-digit numbers by one-digit numbers",
            prerequisites: ["g4-num-place-value"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "✖️",
          },
          {
            id: "g4-ops-division",
            slug: "division-with-remainders",
            name: "Division with Remainders",
            strand: Strand.Operations,
            grade: Grade.G4,
            description: "Divide 2- and 3-digit numbers by 1-digit divisors; interpret remainders",
            cambridgeObjective: "4Ni.06 — Divide numbers and interpret remainders",
            prerequisites: ["g4-ops-multiplication"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "➗",
          },
        ],
      },
      {
        strand: Strand.Fractions,
        subtopics: [],
        topics: [
          {
            id: "g4-frac-equivalent",
            slug: "equivalent-fractions",
            name: "Equivalent Fractions",
            strand: Strand.Fractions,
            grade: Grade.G4,
            description: "Identify and generate equivalent fractions; compare and order fractions",
            cambridgeObjective: "4Nf.01 — Recognise and generate equivalent fractions; compare fractions",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "🔄",
          },
          {
            id: "g4-frac-addition",
            slug: "fraction-addition",
            name: "Adding Fractions with Unlike Denominators",
            strand: Strand.Fractions,
            grade: Grade.G4,
            description: "Add fractions by finding a common denominator; add mixed numbers",
            cambridgeObjective: "4Nf.03 — Add fractions with the same and different denominators",
            prerequisites: ["g4-frac-equivalent"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🍰",
          },
          {
            id: "g4-frac-subtraction",
            slug: "fraction-subtraction",
            name: "Subtracting Fractions",
            strand: Strand.Fractions,
            grade: Grade.G4,
            description: "Subtract fractions with like and unlike denominators",
            cambridgeObjective: "4Nf.04 — Subtract fractions with the same and different denominators",
            prerequisites: ["g4-frac-addition"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🍕",
          },
        ],
      },
      {
        strand: Strand.Decimals,
        subtopics: [],
        topics: [
          {
            id: "g4-dec-tenths-hundredths",
            slug: "decimals-tenths-hundredths",
            name: "Decimals: Tenths and Hundredths",
            strand: Strand.Decimals,
            grade: Grade.G4,
            description: "Understand decimal notation; read, write, and compare decimals to 2 decimal places",
            cambridgeObjective: "4Nf.06 — Understand decimal place value: tenths and hundredths",
            prerequisites: ["g4-frac-equivalent"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "💯",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g4-geo-coordinates",
            slug: "coordinates-first-quadrant",
            name: "Coordinates (First Quadrant)",
            strand: Strand.Geometry,
            grade: Grade.G4,
            description: "Use coordinates to describe positions in the first quadrant; plot and read points",
            cambridgeObjective: "4Gg.05 — Describe and plot positions using coordinates in the first quadrant",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🗺️",
          },
          {
            id: "g4-geo-angles-measuring",
            slug: "measuring-angles",
            name: "Measuring Angles",
            strand: Strand.Geometry,
            grade: Grade.G4,
            description: "Measure and draw angles using a protractor; calculate angles on a straight line",
            cambridgeObjective: "4Gg.04 — Measure and draw angles; recognise angles in shapes",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "📐",
          },
        ],
      },
      {
        strand: Strand.Measurement,
        subtopics: [],
        topics: [
          {
            id: "g4-meas-area",
            slug: "area-and-perimeter",
            name: "Area and Perimeter of Rectangles",
            strand: Strand.Measurement,
            grade: Grade.G4,
            description: "Calculate area and perimeter of squares and rectangles; use formula A = l × w",
            cambridgeObjective: "4Gg.07 — Calculate area of rectangles and compound shapes",
            prerequisites: ["g4-num-place-value"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "📏",
          },
          {
            id: "g4-meas-units",
            slug: "converting-units",
            name: "Converting Units of Measurement",
            strand: Strand.Measurement,
            grade: Grade.G4,
            description: "Convert between units: km/m, m/cm, kg/g, l/ml; solve conversion problems",
            cambridgeObjective: "4Gg.06 — Convert between units of measurement",
            prerequisites: ["g4-ops-multiplication"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "⚖️",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 5 — Cambridge Primary Stage 5 (ages 9–10)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G5,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g5-num-large-numbers",
            slug: "large-numbers-millions",
            name: "Large Numbers to Millions",
            strand: Strand.Numbers,
            grade: Grade.G5,
            description: "Read, write, order, and round numbers to at least 1,000,000",
            cambridgeObjective: "5Np.01 — Understand place value in numbers up to 1 000 000",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🔢",
          },
          {
            id: "g5-num-negative",
            slug: "negative-numbers",
            name: "Negative Numbers",
            strand: Strand.Numbers,
            grade: Grade.G5,
            description: "Order and calculate with negative numbers; find differences across zero",
            cambridgeObjective: "5Ni.01 — Understand and use negative numbers in context",
            prerequisites: ["g5-num-large-numbers"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🌡️",
          },
          {
            id: "g5-num-prime-composite",
            slug: "prime-and-composite-numbers",
            name: "Prime and Composite Numbers",
            strand: Strand.Numbers,
            grade: Grade.G5,
            description: "Identify prime numbers up to 100; understand composite numbers and factor pairs",
            cambridgeObjective: "5Ni.02 — Identify prime numbers and composite numbers",
            prerequisites: ["g5-num-large-numbers"],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🔬",
          },
        ],
      },
      {
        strand: Strand.Operations,
        subtopics: [],
        topics: [
          {
            id: "g5-ops-long-multiplication",
            slug: "long-multiplication",
            name: "Long Multiplication",
            strand: Strand.Operations,
            grade: Grade.G5,
            description: "Multiply 4-digit numbers by 2-digit numbers using formal written methods",
            cambridgeObjective: "5Ni.05 — Multiply and divide numbers, including multi-digit multiplication",
            prerequisites: ["g5-num-large-numbers"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "✖️",
          },
          {
            id: "g5-ops-long-division",
            slug: "long-division",
            name: "Long Division",
            strand: Strand.Operations,
            grade: Grade.G5,
            description: "Divide 3- and 4-digit numbers by 1- and 2-digit divisors; interpret remainders as fractions or decimals",
            cambridgeObjective: "5Ni.06 — Divide using long division; interpret remainders",
            prerequisites: ["g5-ops-long-multiplication"],
            masteryThreshold: 0.80,
            estimatedMinutes: 45,
            iconEmoji: "➗",
          },
          {
            id: "g5-ops-order-of-operations",
            slug: "order-of-operations",
            name: "Order of Operations (BODMAS)",
            strand: Strand.Operations,
            grade: Grade.G5,
            description: "Apply BODMAS/BIDMAS rules to evaluate expressions with multiple operations and brackets",
            cambridgeObjective: "5Ni.07 — Use correct order of operations, including brackets",
            prerequisites: ["g5-ops-long-multiplication"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "🎭",
          },
        ],
      },
      {
        strand: Strand.Fractions,
        subtopics: [],
        topics: [
          {
            id: "g5-frac-mixed-numbers",
            slug: "mixed-numbers-improper-fractions",
            name: "Mixed Numbers and Improper Fractions",
            strand: Strand.Fractions,
            grade: Grade.G5,
            description: "Convert between mixed numbers and improper fractions; compare and order mixed numbers",
            cambridgeObjective: "5Nf.02 — Convert between mixed numbers and improper fractions",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "🔄",
          },
          {
            id: "g5-frac-add-subtract",
            slug: "adding-subtracting-fractions",
            name: "Adding and Subtracting Fractions",
            strand: Strand.Fractions,
            grade: Grade.G5,
            description: "Add and subtract fractions with unlike denominators; add and subtract mixed numbers",
            cambridgeObjective: "5Nf.03 — Add and subtract fractions and mixed numbers",
            prerequisites: ["g5-frac-mixed-numbers"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🍰",
          },
          {
            id: "g5-frac-multiply",
            slug: "multiplying-fractions",
            name: "Multiplying Fractions",
            strand: Strand.Fractions,
            grade: Grade.G5,
            description: "Multiply fractions by whole numbers and fractions; simplify results",
            cambridgeObjective: "5Nf.04 — Multiply fractions by whole numbers and fractions",
            prerequisites: ["g5-frac-add-subtract"],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "✖️",
          },
        ],
      },
      {
        strand: Strand.Decimals,
        subtopics: [],
        topics: [
          {
            id: "g5-dec-operations",
            slug: "decimal-operations",
            name: "Decimal Operations",
            strand: Strand.Decimals,
            grade: Grade.G5,
            description: "Add, subtract, multiply, and divide decimals; apply to money and measurement",
            cambridgeObjective: "5Nf.06 — Add, subtract, multiply and divide decimal numbers",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "💰",
          },
          {
            id: "g5-dec-percentages-intro",
            slug: "percentages-intro",
            name: "Introduction to Percentages",
            strand: Strand.Decimals,
            grade: Grade.G5,
            description: "Understand percentages as parts per hundred; convert between fractions, decimals, and percentages",
            cambridgeObjective: "5Nf.07 — Understand percentages; convert between fractions, decimals and percentages",
            prerequisites: ["g5-dec-operations"],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "💯",
          },
        ],
      },
      {
        strand: Strand.Algebra,
        subtopics: [],
        topics: [
          {
            id: "g5-alg-sequences",
            slug: "number-sequences",
            name: "Number Sequences and Patterns",
            strand: Strand.Algebra,
            grade: Grade.G5,
            description: "Identify, describe, and continue number sequences; use term-to-term rules",
            cambridgeObjective: "5As.01 — Describe and continue number sequences; use term-to-term rules",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 30,
            iconEmoji: "🔢",
          },
          {
            id: "g5-alg-function-machines",
            slug: "function-machines",
            name: "Function Machines",
            strand: Strand.Algebra,
            grade: Grade.G5,
            description: "Use function machines to apply one- and two-step rules; find inputs and outputs",
            cambridgeObjective: "5As.02 — Use function machines to represent and apply one-step and two-step functions",
            prerequisites: ["g5-alg-sequences"],
            masteryThreshold: 0.75,
            estimatedMinutes: 30,
            iconEmoji: "⚙️",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g5-geo-angles-lines",
            slug: "angles-on-lines",
            name: "Angles on Lines and at a Point",
            strand: Strand.Geometry,
            grade: Grade.G5,
            description: "Calculate angles on a straight line (180°), at a point (360°), and vertically opposite angles",
            cambridgeObjective: "5Gg.04 — Understand and apply properties of angles on lines and at a point",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "📐",
          },
          {
            id: "g5-geo-coordinates-all",
            slug: "coordinates-all-quadrants",
            name: "Coordinates in All Four Quadrants",
            strand: Strand.Geometry,
            grade: Grade.G5,
            description: "Plot and read coordinates in all four quadrants; use coordinates to describe translations",
            cambridgeObjective: "5Gg.05 — Use coordinates in all four quadrants",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "🗺️",
          },
        ],
      },
      {
        strand: Strand.Measurement,
        subtopics: [],
        topics: [
          {
            id: "g5-meas-area-triangles",
            slug: "area-triangles-parallelograms",
            name: "Area of Triangles and Parallelograms",
            strand: Strand.Measurement,
            grade: Grade.G5,
            description: "Calculate area of triangles (A = ½bh) and parallelograms (A = bh)",
            cambridgeObjective: "5Gg.07 — Calculate area of triangles and parallelograms",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "📐",
          },
        ],
      },
      {
        strand: Strand.DataAndProbability,
        subtopics: [],
        topics: [
          {
            id: "g5-data-mean",
            slug: "mean-average",
            name: "Mean Average",
            strand: Strand.DataAndProbability,
            grade: Grade.G5,
            description: "Calculate the mean of a data set; understand mean as a representative value",
            cambridgeObjective: "5Ss.03 — Calculate and interpret the mean of a data set",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 30,
            iconEmoji: "📈",
          },
          {
            id: "g5-data-line-graphs",
            slug: "line-graphs",
            name: "Line Graphs",
            strand: Strand.DataAndProbability,
            grade: Grade.G5,
            description: "Draw and interpret line graphs; identify trends and read intermediate values",
            cambridgeObjective: "5Ss.01 — Collect, organise and represent data using line graphs",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 30,
            iconEmoji: "📉",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 6 — Cambridge Primary Stage 6 (ages 10–11)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G6,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g6-num-primes-factors",
            slug: "prime-factorisation",
            name: "Prime Factorisation (HCF and LCM)",
            strand: Strand.Numbers,
            grade: Grade.G6,
            description: "Express numbers as products of prime factors; find HCF and LCM using prime factorisation",
            cambridgeObjective: "6Ni.01 — Use prime factorisation to find HCF and LCM",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🔬",
          },
        ],
      },
      {
        strand: Strand.Fractions,
        subtopics: [],
        topics: [
          {
            id: "g6-frac-ratio",
            slug: "ratio-and-proportion",
            name: "Ratio and Proportion",
            strand: Strand.Fractions,
            grade: Grade.G6,
            description: "Understand and use ratio; solve problems involving direct proportion and scaling",
            cambridgeObjective: "6Nf.05 — Use ratio notation; solve proportion problems",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "🔗",
          },
          {
            id: "g6-frac-multiply-divide",
            slug: "multiplying-dividing-fractions",
            name: "Multiplying and Dividing Fractions",
            strand: Strand.Fractions,
            grade: Grade.G6,
            description: "Multiply fractions by fractions; divide fractions using the reciprocal method",
            cambridgeObjective: "6Nf.03 — Multiply and divide fractions, including mixed numbers",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "🔀",
          },
        ],
      },
      {
        strand: Strand.Decimals,
        subtopics: [],
        topics: [
          {
            id: "g6-dec-percentages",
            slug: "percentages",
            name: "Percentages",
            strand: Strand.Decimals,
            grade: Grade.G6,
            description: "Calculate percentage of quantities; percentage increase/decrease; reverse percentages",
            cambridgeObjective: "6Nf.07 — Calculate percentages; percentage increase and decrease",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "💯",
          },
        ],
      },
      {
        strand: Strand.Algebra,
        subtopics: [],
        topics: [
          {
            id: "g6-alg-variables",
            slug: "intro-to-variables",
            name: "Introduction to Variables and Expressions",
            strand: Strand.Algebra,
            grade: Grade.G6,
            description: "Use letters to represent unknown quantities; write and evaluate algebraic expressions",
            cambridgeObjective: "6As.01 — Use letters to represent variables; write and evaluate expressions",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "🔤",
          },
          {
            id: "g6-alg-nth-term",
            slug: "sequences-nth-term",
            name: "Sequences and the nth Term",
            strand: Strand.Algebra,
            grade: Grade.G6,
            description: "Generate and describe sequences; find the nth term of arithmetic sequences",
            cambridgeObjective: "6As.02 — Describe arithmetic sequences using the nth term",
            prerequisites: ["g6-alg-variables"],
            masteryThreshold: 0.75,
            estimatedMinutes: 35,
            iconEmoji: "🔢",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g6-geo-angles-polygons",
            slug: "angles-in-polygons",
            name: "Angles in Polygons",
            strand: Strand.Geometry,
            grade: Grade.G6,
            description: "Calculate interior and exterior angles of regular and irregular polygons",
            cambridgeObjective: "6Gg.04 — Calculate interior and exterior angles of polygons",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "📐",
          },
          {
            id: "g6-geo-transformations",
            slug: "transformations",
            name: "Transformations (Reflection, Rotation, Translation)",
            strand: Strand.Geometry,
            grade: Grade.G6,
            description: "Transform 2D shapes by reflection, rotation, and translation; describe transformations",
            cambridgeObjective: "6Gg.05 — Transform 2D shapes; describe transformations precisely",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "🔄",
          },
          {
            id: "g6-geo-volume",
            slug: "volume-of-prisms",
            name: "Volume of 3D Shapes",
            strand: Strand.Geometry,
            grade: Grade.G6,
            description: "Calculate volume of cuboids and triangular prisms; understand units of volume (cm³, m³)",
            cambridgeObjective: "6Gg.07 — Calculate volume of cuboids and prisms",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "📦",
          },
        ],
      },
      {
        strand: Strand.DataAndProbability,
        subtopics: [],
        topics: [
          {
            id: "g6-data-statistics",
            slug: "mean-median-mode",
            name: "Mean, Median, Mode and Range",
            strand: Strand.DataAndProbability,
            grade: Grade.G6,
            description: "Calculate and compare mean, median, mode, and range; interpret in context",
            cambridgeObjective: "6Ss.03 — Calculate mean, median, mode and range; interpret statistics",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "📈",
          },
          {
            id: "g6-data-probability",
            slug: "probability-intro",
            name: "Introduction to Probability",
            strand: Strand.DataAndProbability,
            grade: Grade.G6,
            description: "Understand probability on a scale 0–1; list outcomes; calculate simple probabilities",
            cambridgeObjective: "6Sp.01 — Understand and use probability; calculate probability of outcomes",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 35,
            iconEmoji: "🎲",
          },
        ],
      },
      {
        strand: Strand.WordProblems,
        subtopics: [],
        topics: [
          {
            id: "g6-word-ratio-proportion",
            slug: "word-problems-ratio",
            name: "Ratio and Proportion Word Problems",
            strand: Strand.WordProblems,
            grade: Grade.G6,
            description: "Solve multi-step word problems involving ratio, proportion, and percentage",
            cambridgeObjective: "6Nf.05 — Solve problems involving ratio and direct proportion",
            prerequisites: ["g6-frac-ratio", "g6-dec-percentages"],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "📖",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 7 — Cambridge Lower Secondary Stage 7 (ages 11–12)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G7,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g7-num-indices",
            slug: "indices-and-powers",
            name: "Indices and Powers",
            strand: Strand.Numbers,
            grade: Grade.G7,
            description: "Understand and use index notation; evaluate powers and roots; apply index laws",
            cambridgeObjective: "7Ni.01 — Use index notation; apply the index laws for multiplication and division",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🔬",
          },
          {
            id: "g7-num-rational",
            slug: "rational-and-irrational-numbers",
            name: "Rational and Irrational Numbers",
            strand: Strand.Numbers,
            grade: Grade.G7,
            description: "Distinguish between rational and irrational numbers; convert recurring decimals to fractions",
            cambridgeObjective: "7Ni.02 — Understand rational and irrational numbers",
            prerequisites: ["g7-num-indices"],
            masteryThreshold: 0.75,
            estimatedMinutes: 35,
            iconEmoji: "∞",
          },
        ],
      },
      {
        strand: Strand.Algebra,
        subtopics: [],
        topics: [
          {
            id: "g7-alg-expressions",
            slug: "expanding-simplifying-expressions",
            name: "Expanding and Simplifying Expressions",
            strand: Strand.Algebra,
            grade: Grade.G7,
            description: "Expand single brackets; collect like terms; simplify algebraic expressions",
            cambridgeObjective: "7As.01 — Understand and use algebraic notation; expand brackets and simplify",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🔤",
          },
          {
            id: "g7-alg-linear-equations",
            slug: "linear-equations",
            name: "Solving Linear Equations",
            strand: Strand.Algebra,
            grade: Grade.G7,
            description: "Solve one- and two-step linear equations; equations with unknowns on both sides",
            cambridgeObjective: "7As.03 — Solve linear equations with one unknown",
            prerequisites: ["g7-alg-expressions"],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "🧮",
          },
          {
            id: "g7-alg-inequalities",
            slug: "inequalities",
            name: "Inequalities",
            strand: Strand.Algebra,
            grade: Grade.G7,
            description: "Understand and solve linear inequalities; represent solutions on a number line",
            cambridgeObjective: "7As.04 — Understand and use inequalities",
            prerequisites: ["g7-alg-linear-equations"],
            masteryThreshold: 0.75,
            estimatedMinutes: 35,
            iconEmoji: "⚖️",
          },
          {
            id: "g7-alg-graphs",
            slug: "linear-graphs",
            name: "Linear Graphs (y = mx + c)",
            strand: Strand.Algebra,
            grade: Grade.G7,
            description: "Plot and interpret linear graphs; understand gradient and y-intercept",
            cambridgeObjective: "7As.05 — Draw and interpret linear graphs; understand gradient and intercept",
            prerequisites: ["g7-alg-linear-equations"],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "📉",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g7-geo-pythagoras-intro",
            slug: "pythagoras-intro",
            name: "Introduction to Pythagoras' Theorem",
            strand: Strand.Geometry,
            grade: Grade.G7,
            description: "Understand Pythagoras' theorem; calculate the hypotenuse and missing sides in right-angled triangles",
            cambridgeObjective: "7Gg.06 — Know and apply Pythagoras' theorem in right-angled triangles",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "📐",
          },
          {
            id: "g7-geo-circles",
            slug: "circumference-and-area-of-circles",
            name: "Circumference and Area of Circles",
            strand: Strand.Geometry,
            grade: Grade.G7,
            description: "Calculate circumference (C = 2πr) and area (A = πr²) of circles",
            cambridgeObjective: "7Gg.07 — Calculate circumference and area of circles using π",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🔵",
          },
          {
            id: "g7-geo-angles-parallel",
            slug: "angles-parallel-lines",
            name: "Angles and Parallel Lines",
            strand: Strand.Geometry,
            grade: Grade.G7,
            description: "Identify and calculate corresponding, alternate, and co-interior angles",
            cambridgeObjective: "7Gg.04 — Understand angle properties of parallel lines and transversals",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 35,
            iconEmoji: "📐",
          },
        ],
      },
      {
        strand: Strand.DataAndProbability,
        subtopics: [],
        topics: [
          {
            id: "g7-data-grouped-frequency",
            slug: "grouped-frequency-tables",
            name: "Grouped Frequency Tables",
            strand: Strand.DataAndProbability,
            grade: Grade.G7,
            description: "Construct and interpret grouped frequency tables; estimate mean from grouped data",
            cambridgeObjective: "7Ss.01 — Collect, group, and represent continuous data in frequency tables",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 35,
            iconEmoji: "📊",
          },
          {
            id: "g7-data-probability-combined",
            slug: "combined-events-probability",
            name: "Probability of Combined Events",
            strand: Strand.DataAndProbability,
            grade: Grade.G7,
            description: "Calculate probability of AND/OR events; construct and use sample space diagrams",
            cambridgeObjective: "7Sp.02 — Calculate probability of combined events; use sample spaces",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "🎲",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRADE 8 — Cambridge Lower Secondary Stage 8 (ages 12–13)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    grade: Grade.G8,
    strands: [
      {
        strand: Strand.Numbers,
        subtopics: [],
        topics: [
          {
            id: "g8-num-standard-form",
            slug: "standard-form",
            name: "Standard Form (Scientific Notation)",
            strand: Strand.Numbers,
            grade: Grade.G8,
            description: "Write very large and small numbers in standard form; multiply and divide in standard form",
            cambridgeObjective: "8Ni.01 — Use and interpret standard form (scientific notation)",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 40,
            iconEmoji: "🔬",
          },
          {
            id: "g8-num-compound-interest",
            slug: "compound-interest-percentage-change",
            name: "Compound Interest and Percentage Change",
            strand: Strand.Numbers,
            grade: Grade.G8,
            description: "Calculate compound interest; apply repeated percentage change; reverse percentage problems",
            cambridgeObjective: "8Ni.02 — Apply percentage increase/decrease and compound interest",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "💰",
          },
        ],
      },
      {
        strand: Strand.Algebra,
        subtopics: [],
        topics: [
          {
            id: "g8-alg-simultaneous",
            slug: "simultaneous-equations",
            name: "Simultaneous Equations",
            strand: Strand.Algebra,
            grade: Grade.G8,
            description: "Solve pairs of simultaneous linear equations by elimination and substitution",
            cambridgeObjective: "8As.04 — Solve simultaneous linear equations algebraically and graphically",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 50,
            iconEmoji: "🧮",
          },
          {
            id: "g8-alg-quadratics",
            slug: "expanding-factorising-quadratics",
            name: "Expanding and Factorising Quadratics",
            strand: Strand.Algebra,
            grade: Grade.G8,
            description: "Expand double brackets; factorise quadratic expressions of the form x² + bx + c",
            cambridgeObjective: "8As.02 — Expand and factorise quadratic expressions",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 50,
            iconEmoji: "🔤",
          },
          {
            id: "g8-alg-functions-graphs",
            slug: "graphs-of-functions",
            name: "Graphs of Functions",
            strand: Strand.Algebra,
            grade: Grade.G8,
            description: "Plot and interpret quadratic and other non-linear graphs; identify key features",
            cambridgeObjective: "8As.06 — Plot and interpret graphs of linear and non-linear functions",
            prerequisites: ["g8-alg-quadratics"],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "📉",
          },
        ],
      },
      {
        strand: Strand.Geometry,
        subtopics: [],
        topics: [
          {
            id: "g8-geo-pythagoras",
            slug: "pythagoras-theorem",
            name: "Pythagoras' Theorem (Applied)",
            strand: Strand.Geometry,
            grade: Grade.G8,
            description: "Apply Pythagoras' theorem to 2D and simple 3D problems; calculate distances",
            cambridgeObjective: "8Gg.06 — Apply Pythagoras' theorem in 2D and 3D contexts",
            prerequisites: [],
            masteryThreshold: 0.80,
            estimatedMinutes: 45,
            iconEmoji: "📐",
          },
          {
            id: "g8-geo-trigonometry",
            slug: "trigonometry-soh-cah-toa",
            name: "Trigonometry (SOH-CAH-TOA)",
            strand: Strand.Geometry,
            grade: Grade.G8,
            description: "Use sin, cos, and tan ratios to find missing sides and angles in right-angled triangles",
            cambridgeObjective: "8Gg.07 — Use trigonometric ratios in right-angled triangles",
            prerequisites: ["g8-geo-pythagoras"],
            masteryThreshold: 0.75,
            estimatedMinutes: 50,
            iconEmoji: "📐",
          },
          {
            id: "g8-geo-similarity-congruency",
            slug: "similarity-and-congruency",
            name: "Similarity and Congruency",
            strand: Strand.Geometry,
            grade: Grade.G8,
            description: "Identify congruent and similar shapes; use scale factors; apply in problem solving",
            cambridgeObjective: "8Gg.03 — Understand and apply congruence and similarity",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "🔷",
          },
        ],
      },
      {
        strand: Strand.DataAndProbability,
        subtopics: [],
        topics: [
          {
            id: "g8-data-probability-trees",
            slug: "probability-tree-diagrams",
            name: "Probability Tree Diagrams",
            strand: Strand.DataAndProbability,
            grade: Grade.G8,
            description: "Draw and use tree diagrams to calculate probabilities of combined independent events",
            cambridgeObjective: "8Sp.02 — Use tree diagrams to calculate probability of independent events",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 45,
            iconEmoji: "🌳",
          },
          {
            id: "g8-data-scatter-plots",
            slug: "scatter-plots-correlation",
            name: "Scatter Plots and Correlation",
            strand: Strand.DataAndProbability,
            grade: Grade.G8,
            description: "Plot and interpret scatter graphs; describe correlation; draw and use lines of best fit",
            cambridgeObjective: "8Ss.03 — Draw and interpret scatter graphs; describe correlation",
            prerequisites: [],
            masteryThreshold: 0.75,
            estimatedMinutes: 40,
            iconEmoji: "📈",
          },
        ],
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

/**
 * Returns the Cambridge objective string for a topic, or empty string if not found.
 * Used by question generators to align AI prompts with the Cambridge framework.
 */
export function getCambridgeObjective(topicId: string): string {
  return getTopicById(topicId)?.cambridgeObjective ?? "";
}
