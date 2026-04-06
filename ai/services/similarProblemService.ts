/**
 * @module ai/services/similarProblemService
 *
 * Generates a math problem that is structurally identical to the original
 * but with different numbers/context. Used by the "Try one like this" button
 * in Ask MathAI after a student watches an animated explanation.
 *
 * The AI is constrained to keep the SAME concept, difficulty, and solving
 * method — only the specific values change.
 */

import { callAIModelJSON } from "../ai_client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SimilarProblemRequest {
  problem:  string;       // original question text
  type:     string;       // mathData.type (e.g., "multiplication", "fraction_addition")
  grade:    string;       // e.g., "G3"
  answer?:  string;       // original answer (for context, not reused)
}

export interface SimilarProblem {
  problem:     string;
  answer:      string;
  steps:       string[];
  explanation: string;
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a math problem generator for a children's learning app (grades 1-8).
You generate practice problems that are similar to ones the student just worked on.

STRICT RULES:
- Keep the SAME concept as the original problem
- Keep the SAME difficulty level
- Change ONLY the numbers or context slightly
- Do NOT introduce new concepts
- The new problem must be solvable in the same way
- Use child-friendly language
- Steps should be short, clear sentences
- Explanation should be 1-2 sentences max
- Do NOT use LaTeX — use plain text with symbols like +, -, x, /, =

Return ONLY valid JSON matching this exact schema:
{
  "problem": "The question text",
  "answer": "The answer (number or short expression)",
  "steps": ["Step 1 text", "Step 2 text", ...],
  "explanation": "Brief explanation of why the answer is correct"
}`;

// ─── Generator ───────────────────────────────────────────────────────────────

export async function generateSimilarProblem(
  req: SimilarProblemRequest,
): Promise<SimilarProblem> {
  const userPrompt = [
    `Generate a similar math problem.`,
    ``,
    `Original problem: "${req.problem}"`,
    `Type: ${req.type}`,
    `Grade: ${req.grade}`,
    req.answer ? `Original answer: ${req.answer}` : "",
    ``,
    `Change the numbers but keep everything else the same.`,
    `Output ONLY the JSON, no other text.`,
  ].filter(Boolean).join("\n");

  return callAIModelJSON<SimilarProblem>(
    `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    {
      callSite: "similar_problem_generator",
      temperature: 0.7,  // slight variation
      maxTokens: 400,
    },
  );
}
