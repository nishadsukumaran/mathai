/**
 * @module ai/providers/mock
 *
 * Deterministic mock AI provider for development and testing.
 *
 * WHEN TO USE:
 *   - Local development: Set AI_PROVIDER=mock in .env to avoid API costs
 *   - Unit tests: MockProvider returns predictable responses
 *   - CI: No API keys needed in CI environment
 *   - Template-only mode: Tutor engines don't call AI at all currently —
 *     MockProvider is a clean safety net for the callAIModel() path
 *
 * BEHAVIOUR:
 *   - Returns pre-canned text or JSON based on callSite
 *   - Optional simulated delay (configure via MOCK_AI_DELAY_MS env var)
 *   - Never throws unless explicitly configured to (for error-path testing)
 *
 * USAGE IN TESTS:
 *   const provider = new MockProvider({ responses: { "hint_engine": "Think about the top number first." } });
 *   const result   = await provider.generate({ prompt: "...", callSite: "hint_engine" });
 *   expect(result.text).toBe("Think about the top number first.");
 */

import type { AIProvider, AIRequest, AIResponse } from "./types";
import { AIProviderError } from "./types";

// ─── Configuration ─────────────────────────────────────────────────────────

export interface MockProviderOptions {
  /**
   * Override responses per callSite.
   * Key: callSite string (or "" for default).
   * Value: text or JSON string to return.
   */
  responses?: Record<string, string>;

  /**
   * Simulate network latency in ms (default: 0 in test, 200 in dev).
   * Helps catch loading-state issues during UI development.
   */
  delayMs?: number;

  /**
   * If set to true, generate() throws AIProviderError.
   * Useful for testing error-handling paths.
   */
  forceError?: boolean;
}

// ─── Default canned responses by call site ────────────────────────────────

const DEFAULT_TEXT_RESPONSES: Record<string, string> = {
  hint_engine:         "Think step by step. Start by looking at the top numbers (numerators).",
  explanation_engine:  "Here's how to solve this: First identify the key numbers, then apply the operation.",
  misconception:       "It looks like you may have mixed up the numerator and denominator.",
  default:             "Mock AI response. Set AI_PROVIDER=anthropic to use real AI.",
};

const DEFAULT_JSON_RESPONSES: Record<string, string> = {
  default: JSON.stringify({
    steps:   [],
    summary: "Mock structured response",
    hint:    "Check your work and try again.",
  }),
};

// ─── MockProvider ─────────────────────────────────────────────────────────

export class MockProvider implements AIProvider {
  readonly name = "mock" as const;

  private readonly options: Required<MockProviderOptions>;

  constructor(options: MockProviderOptions = {}) {
    const envDelay = parseInt(process.env["MOCK_AI_DELAY_MS"] ?? "0", 10);
    this.options = {
      responses:  options.responses  ?? {},
      delayMs:    options.delayMs    ?? (isNaN(envDelay) ? 0 : envDelay),
      forceError: options.forceError ?? false,
    };
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (this.options.delayMs > 0) {
      await sleep(this.options.delayMs);
    }

    if (this.options.forceError) {
      throw new AIProviderError(
        "MockProvider: forceError=true — simulating provider failure",
        "mock",
        503,
        true
      );
    }

    const callSite = request.callSite ?? "default";
    const isJson   = request.responseFormat === "json";

    // 1. Check custom override first
    const customResponse = this.options.responses[callSite] ?? this.options.responses["default"];
    if (customResponse !== undefined) {
      return this.buildResponse(customResponse, request);
    }

    // 2. Fall back to built-in canned responses
    const cannedMap   = isJson ? DEFAULT_JSON_RESPONSES : DEFAULT_TEXT_RESPONSES;
    const cannedText  = cannedMap[callSite] ?? cannedMap["default"];

    return this.buildResponse(cannedText ?? "Mock response", request);
  }

  async healthCheck(): Promise<boolean> {
    return true; // Mock is always healthy
  }

  private buildResponse(text: string, request: AIRequest): AIResponse {
    return {
      text,
      model:    "mock-1.0",
      provider: "mock",
      usage: {
        inputTokens:  estimateTokens(request.prompt),
        outputTokens: estimateTokens(text),
        totalTokens:  estimateTokens(request.prompt) + estimateTokens(text),
      },
      latencyMs: this.options.delayMs,
    };
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
