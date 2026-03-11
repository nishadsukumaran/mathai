/**
 * @module ai/providers/config
 *
 * Provider factory — reads AI_PROVIDER from env and returns the correct implementation.
 *
 * ENVIRONMENT VARIABLES:
 *   AI_PROVIDER=vercel_gateway → VercelGatewayProvider (production — all calls through Vercel AI Gateway)
 *   AI_PROVIDER=mock           → MockProvider (default, no API key needed)
 *   AI_PROVIDER=anthropic      → AnthropicProvider (direct Anthropic, legacy)
 *
 * ADDING A NEW PROVIDER:
 *   1. Create ai/providers/openai.ts implementing AIProvider
 *   2. Add "openai" to ProviderName in types.ts
 *   3. Add a case in createProvider() below
 *   4. Set AI_PROVIDER=openai in .env
 *
 * RETRY POLICY:
 *   All providers are wrapped in withRetry() which handles:
 *   - Transient network errors
 *   - Rate-limit errors (429) — exponential backoff
 *   - Provider overload (529/503) — retryable=true on the thrown error
 */

import type { AIProvider, AIRequest, AIResponse, ProviderName } from "./types";
import { AIProviderError } from "./types";
import { VercelGatewayProvider } from "./vercel_gateway";
import { AnthropicProvider }     from "./anthropic";
import { MockProvider }           from "./mock";

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createProvider(override?: ProviderName): AIProvider {
  const name = (override ?? process.env["AI_PROVIDER"] ?? "mock") as ProviderName;

  switch (name) {
    case "vercel_gateway":
      return withRetry(new VercelGatewayProvider(), { maxAttempts: 3 });

    case "anthropic":
      return withRetry(new AnthropicProvider(), { maxAttempts: 3 });

    case "mock":
      return new MockProvider({
        delayMs: parseInt(process.env["MOCK_AI_DELAY_MS"] ?? "0", 10) || 0,
      });

    case "openai":
      // TODO: implement OpenAI provider
      console.warn(`[ai/providers] OpenAI provider not yet implemented — falling back to mock`);
      return new MockProvider();

    default:
      console.warn(`[ai/providers] Unknown provider "${name}" — falling back to mock`);
      return new MockProvider();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// Instantiated once per process. Can be replaced in tests via dependency injection.

export let aiProvider: AIProvider = createProvider();

/** Swap the singleton — useful in tests or server startup. */
export function setProvider(provider: AIProvider): void {
  aiProvider = provider;
}

// ─── withRetry wrapper ────────────────────────────────────────────────────────

interface RetryOptions {
  /** Maximum number of attempts including the first try (default: 3) */
  maxAttempts?:    number;
  /** Base delay in ms for exponential backoff (default: 500) */
  baseDelayMs?:    number;
  /** Maximum delay cap in ms (default: 10_000) */
  maxDelayMs?:     number;
}

/**
 * Wraps any AIProvider with automatic retry on transient failures.
 * Only retries when AIProviderError.retryable === true.
 */
export function withRetry(
  provider: AIProvider,
  options:  RetryOptions = {}
): AIProvider {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs  = 10_000,
  } = options;

  return {
    name: provider.name,

    async generate(request: AIRequest): Promise<AIResponse> {
      let lastError: AIProviderError | undefined;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await provider.generate(request);
        } catch (err) {
          if (!(err instanceof AIProviderError) || !err.retryable) {
            throw err; // Not retryable — fail fast
          }
          lastError = err;

          if (attempt < maxAttempts) {
            const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
            const jitter = Math.random() * delay * 0.1; // ±10% jitter
            console.warn(
              `[ai/providers] Attempt ${attempt}/${maxAttempts} failed (${err.message}). ` +
              `Retrying in ${Math.round(delay + jitter)}ms…`
            );
            await sleep(delay + jitter);
          }
        }
      }

      throw lastError ?? new AIProviderError(
        `Failed after ${maxAttempts} attempts`,
        provider.name,
        undefined,
        false
      );
    },

    healthCheck: provider.healthCheck?.bind(provider),
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
