/**
 * @module ai/tutor/concept_identifier
 *
 * Maps a student's question/struggle to a specific math concept.
 * Used by hint_engine and explanation_engine to tailor their responses.
 */

import { Grade, Strand } from "@/types";

export interface MathConcept {
  id: string;
  slug: string;
  name: string;
  strand: Strand;
  grade: Grade;
  relatedTopicIds: string[];
  keywords: string[];
}

/**
 * Returns the MathConcept for a given topicId.
 * In production, this resolves from the curriculum database via CurriculumService.
 */
export async function identifyConcept(
  topicId: string,
  _studentQuestion: string
): Promise<MathConcept> {
  // TODO: Replace with a DB lookup via CurriculumService
  // The _studentQuestion can be used for secondary NLP-based concept detection
  // if the topicId alone doesn't narrow it down enough.

  return CONCEPT_STUB_MAP[topicId] ?? FALLBACK_CONCEPT;
}

// ─── Stub Data (replace with DB calls) ────────────────────────────────────────

const CONCEPT_STUB_MAP: Record<string, MathConcept> = {
  "fraction-addition": {
    id: "concept-001",
    slug: "fraction-addition",
    name: "Adding Fractions",
    strand: Strand.Fractions,
    grade: Grade.G4,
    relatedTopicIds: ["fraction-subtraction", "common-denominators", "equivalent-fractions"],
    keywords: ["fraction", "numerator", "denominator", "common denominator", "add", "plus"],
  },
  "multiplication-2digit": {
    id: "concept-002",
    slug: "multiplication-2digit",
    name: "Multiplying 2-Digit Numbers",
    strand: Strand.Operations,
    grade: Grade.G3,
    relatedTopicIds: ["multiplication-1digit", "area-model", "partial-products"],
    keywords: ["multiply", "times", "product", "groups of"],
  },
};

const FALLBACK_CONCEPT: MathConcept = {
  id: "concept-unknown",
  slug: "general-math",
  name: "Math Problem",
  strand: Strand.Numbers,
  grade: Grade.G3,
  relatedTopicIds: [],
  keywords: [],
};
