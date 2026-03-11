/**
 * @module ai/providers
 *
 * MathAI AI provider layer.
 * All production AI calls route through Vercel AI Gateway.
 *
 * AI_PROVIDER=vercel_gateway → VercelGatewayProvider (production)
 * AI_PROVIDER=mock           → MockProvider (dev / testing)
 * AI_PROVIDER=anthropic      → AnthropicProvider (legacy direct)
 *
 * Required env vars for production:
 *   VERCEL_AI_GATEWAY_URL=https://ai.vercel.app
 *   VERCEL_AI_GATEWAY_KEY=<vercel-oidc-token>
 *   AI_MODEL_DEFAULT=anthropic/claude-3-5-haiku-20241022
 *   AI_MODEL_EXPLANATION=anthropic/claude-3-7-sonnet-20250219
 */

export type { AIProvider, AIRequest, AIResponse, ProviderName } from "./types";
export { AIProviderError, AIParseError } from "./types";

// Implementations
export { VercelGatewayProvider } from "./vercel_gateway"; // PRODUCTION
export { AnthropicProvider }     from "./anthropic";       // Legacy
export { MockProvider }           from "./mock";            // Dev/test

// Factory + singleton
export { aiProvider, setProvider, createProvider, withRetry } from "./config";
