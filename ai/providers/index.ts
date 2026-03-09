/**
 * @module ai/providers
 *
 * MathAI AI provider layer.
 *
 * ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
 *
 *   Engines → callAIModel() → aiProvider.generate() → [Anthropic | Mock]
 *
 *   The active provider is selected at startup from AI_PROVIDER env var:
 *     AI_PROVIDER=mock       → MockProvider (default — no API key needed)
 *     AI_PROVIDER=anthropic  → AnthropicProvider (production)
 *
 * ─── USAGE IN TUTOR ENGINES ───────────────────────────────────────────────────
 *
 *   // Direct (bypass callAIModel if you need full AIResponse):
 *   import { aiProvider } from "@/ai/providers";
 *   const response = await aiProvider.generate({
 *     prompt:   buildHintPrompt(question, concept),
 *     system:   TUTOR_SYSTEM_PROMPT,
 *     callSite: "hint_engine.generate",
 *     maxTokens: 300,
 *   });
 *
 *   // Via callAIModel() (simpler, returns string):
 *   import { callAIModel } from "@/ai/ai_client";
 *   const text = await callAIModel(prompt, { system, maxTokens: 300, callSite: "hint_engine" });
 *
 * ─── QUICK REFERENCE ──────────────────────────────────────────────────────────
 *
 *   | Export              | Purpose                                    |
 *   |---------------------|--------------------------------------------|
 *   | aiProvider          | Singleton — use this in engines            |
 *   | setProvider()       | Swap singleton in tests                    |
 *   | createProvider()    | Create a fresh instance (e.g. per request) |
 *   | withRetry()         | Wrap any provider with retry logic         |
 *   | AnthropicProvider   | Direct class access (for DI in tests)      |
 *   | MockProvider        | Direct class access (for DI in tests)      |
 *   | AIProviderError     | Catch this in try/catch blocks             |
 *   | AIParseError        | Thrown by parseStructuredJSON()            |
 *
 * ─── ENV VARS ─────────────────────────────────────────────────────────────────
 *
 *   AI_PROVIDER=mock              # "mock" or "anthropic"
 *   ANTHROPIC_API_KEY=sk-ant-...  # Required when AI_PROVIDER=anthropic
 *   AI_MODEL_DEFAULT=claude-3-5-haiku-20241022
 *   AI_MODEL_EXPLANATION=claude-3-5-sonnet-20241022
 *   MOCK_AI_DELAY_MS=200          # Simulated latency for mock provider
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AIProvider,
  AIRequest,
  AIResponse,
  ProviderName,
} from "./types";

export { AIProviderError, AIParseError } from "./types";

// ─── Implementations ──────────────────────────────────────────────────────────
export { AnthropicProvider } from "./anthropic";
export { MockProvider }      from "./mock";

// ─── Factory + singleton ──────────────────────────────────────────────────────
export {
  aiProvider,
  setProvider,
  createProvider,
  withRetry,
} from "./config";
