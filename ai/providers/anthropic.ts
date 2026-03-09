/**
 * @module ai/providers/anthropic
 *
 * Anthropic Claude provider via the Vercel AI SDK.
 *
 * ─── HOW TO ACTIVATE ──────────────────────────────────────────────────────────
 *
 * 1. Install dependencies:
 *      npm install ai @ai-sdk/anthropic
 *
 * 2. Set environment variables in .env:
 *      AI_PROVIDER=anthropic
 *      ANTHROPIC_API_KEY=sk-ant-...
 *      AI_MODEL_DEFAULT=claude-3-5-haiku-20241022   # cheapest, fastest for tutoring
 *      # Optional overrides per call site:
 *      AI_MODEL_EXPLANATION=claude-3-5-sonnet-20241022  # richer model for full explanations
 *
 * 3. Uncomment the SDK imports below and remove the placeholder types.
 *
 * 4. Set AI_PROVIDER=mock in .env for development/testing to avoid API costs.
 *
 * ─── MODEL RECOMMENDATIONS ────────────────────────────────────────────────────
 *
 * For MathAI tutoring use-cases:
 *   Hints (fast, cheap)     → claude-3-5-haiku-20241022
 *   Explanations (richer)   → claude-3-5-sonnet-20241022
 *   Misconception detection → claude-3-5-haiku-20241022 (template-based is sufficient)
 *
 * Keep maxTokens low (300–800) for tutoring — responses must be short and child-friendly.
 */

// ─── STEP 1: Uncomment when ai + @ai-sdk/anthropic are installed ───────────────
//
// import { generateText, type CoreMessage } from "ai";
// import { createAnthropic } from "@ai-sdk/anthropic";
//
// ─────────────────────────────────────────────────────────────────────────────

import type { AIProvider, AIRequest, AIResponse } from "./types";
import { AIProviderError } from "./types";

// ─── Placeholder types (remove once SDK is installed) ─────────────────────────
// These are here so the file compiles cleanly before the SDK is added.

type GenerateTextResult = { text: string; usage: { promptTokens: number; completionTokens: number } };
type AnthropicModel = (modelId: string) => unknown;

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL    = process.env["AI_MODEL_DEFAULT"]     ?? "claude-3-5-haiku-20241022";
const EXPLANATION_MODEL = process.env["AI_MODEL_EXPLANATION"] ?? DEFAULT_MODEL;

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;

  // ── STEP 2: Uncomment this block when SDK is installed ────────────────────
  //
  // private readonly anthropic = createAnthropic({
  //   apiKey: process.env["ANTHROPIC_API_KEY"],
  //   // Optional: route through Vercel AI Gateway for observability + rate limiting
  //   // baseURL: process.env["VERCEL_AI_GATEWAY_URL"],
  //   // headers: { "x-vercel-ai-gateway-key": process.env["VERCEL_AI_GATEWAY_KEY"] },
  // });
  //
  // ─────────────────────────────────────────────────────────────────────────

  async generate(request: AIRequest): Promise<AIResponse> {
    const startMs = Date.now();
    const model   = this.resolveModel(request);

    this.validateConfig();

    try {
      // ── STEP 3: Uncomment when SDK is installed ──────────────────────────
      //
      // const messages: CoreMessage[] = [];
      // if (request.system) {
      //   messages.push({ role: "system", content: request.system });
      // }
      // messages.push({ role: "user", content: request.prompt });
      //
      // const result: GenerateTextResult = await generateText({
      //   model:       this.anthropic(model) as AnthropicModel,
      //   messages,
      //   temperature: request.temperature ?? 0.4,
      //   maxTokens:   request.maxTokens   ?? 600,
      // });
      //
      // return {
      //   text:     result.text,
      //   model,
      //   provider: "anthropic",
      //   usage: {
      //     inputTokens:  result.usage.promptTokens,
      //     outputTokens: result.usage.completionTokens,
      //     totalTokens:  result.usage.promptTokens + result.usage.completionTokens,
      //   },
      //   latencyMs: Date.now() - startMs,
      // };
      // ────────────────────────────────────────────────────────────────────

      // Temporary: throw until SDK is activated
      throw new AIProviderError(
        "AnthropicProvider: SDK not yet activated. " +
        "Run: npm install ai @ai-sdk/anthropic and uncomment the SDK code in ai/providers/anthropic.ts",
        "anthropic",
        503,
        false
      );

    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      const e = err as { status?: number; message?: string };
      throw new AIProviderError(
        `Anthropic API error: ${e.message ?? "Unknown error"}`,
        "anthropic",
        e.status,
        e.status === 429 || e.status === 529 // rate limit / overload → retryable
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generate({
        prompt:    "Reply with the word OK and nothing else.",
        maxTokens: 5,
        callSite:  "health_check",
      });
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private resolveModel(request: AIRequest): string {
    if (request.model) return request.model;
    // Use richer model for detailed explanations
    if (request.callSite?.includes("explanation")) return EXPLANATION_MODEL;
    return DEFAULT_MODEL;
  }

  private validateConfig(): void {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new AIProviderError(
        "ANTHROPIC_API_KEY is not set. Add it to .env to use the Anthropic provider.",
        "anthropic",
        undefined,
        false
      );
    }
  }
}

// ─── Usage reference ──────────────────────────────────────────────────────────
// Reminder to suppress the placeholder type warnings once SDK is installed:
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _SuppressUnused = [GenerateTextResult, AnthropicModel];
