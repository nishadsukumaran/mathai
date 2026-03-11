/**
 * @module ai/services
 *
 * AI-first service layer for MathAI.
 * All services route through Vercel AI Gateway (AI_PROVIDER=vercel_gateway).
 *
 * questionGeneratorService — generate dynamic practice questions from student context
 * recommendationService    — personalise the practice menu with AI reasons
 * askMathAIService         — answer freeform student questions
 */

export { questionGeneratorService } from "./questionGeneratorService";
export type { GenerateQuestionsContext, AIGeneratedQuestion } from "./questionGeneratorService";

export { recommendationService } from "./recommendationService";
export type { RecommendationCandidate, StudentRecommendationContext, AIRecommendation } from "./recommendationService";

export { askMathAIService } from "./askMathAIService";
export type { AskMathAIRequest, AskMathAIResponse, AskMathAIStep } from "./askMathAIService";
