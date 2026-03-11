/**
 * @module ai/providers/vercel_gateway
 *
 * MathAI AI provider — Vercel AI Gateway.
 *
 * ALL AI calls in production route through Vercel AI Gateway.
 * The gateway provides:
 *   - Unified access to models from Anthropic, OpenAI, Google, Meta, and more
 *   - Built-in caching, rate limiting, and observability
 *   - Spend controls and usage analytics via the Vercel dashboard
 *   - Model fallbacks and routing rules (configure in vercel.json or dashboard)
 *
 * ─── ACTIVATION ────────────────────────────────────────────────────────────────
 *
 * Set in .env (or Vercel environment variables):
 *   AI_PROVIDER=vercel_gateway
 *   VERCEL_AI_GATEWAY_URL=https://ai.vercel.app          # Gateway base URL
 *   VERCEL_AI_GATEWAY_KEY=<your-vercel-oidc-token>       # From Vercel dashboard
 *   AI_MODEL_DEFAULT=anthropic/claude-3-5-haiku-20241022 # Cheap, fast tutoring
 *   AI_MODEL_EXPLANATION=anthropic/claude-3-7-sonnet-20250219 # Rich explanations
 *
 * ─── MODEL NAMING ──────────────────────────────────────────────────────────────
 *
 * Vercel AI Gateway uses provider-prefixed model IDs:
 *   anthropic/claude-3-5-haiku-20241022    → fast, cheap (hints, questions)
 *   anthropic/claude-3-7-sonnet-20250219   → smart (explanations, recommendations)
 *   openai/gpt-4o-mini                     → alternative fast model
 *   meta/llama-3.3-70b-instruct            → open-source option
 *
 * ─── HOW IT WORKS ──────────────────────────────────────────────────────────────
 *
 * Uses @ai-sdk/anthropic's createAnthropic() with baseURL overridden to point
 * at Vercel AI Gateway. The gateway forwards requests to the upstream provider,
 * applying caching, analytics, and rate limiting in between.
 */

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { AIProvider, AIRequest, AIResponse } from "./types";
import { AIProviderError } from "./types";

// ─── Model config ─────────────────────────────────────────────────────────────

const DEFAULT_MODEL     = process.env["AI_MODEL_DEFAULT"]     ?? "anthropic/claude-3-5-haiku-20241022";
const EXPLANATION_MODEL = process.env["AI_MODEL_EXPLANATION"] ?? "anthropic/claude-3-7-sonnet-20250219";

// ─── Provider ─────────────────────────────────────────────────────────────────

export class VercelGatewayProvider implements AIProvider {
  readonly name = "vercel_gateway" as const;

  private readonly client;

  constructor() {
    const gatewayUrl = process.env["VERCEL_AI_GATEWAY_URL"];
    const gatewayKey = process.env["VERCEL_AI_GATEWAY_KEY"];

    if (!gatewayUrl || !gatewayKey) {
      throw new AIProviderError(
        "VERCEL_AI_GATEWAY_URL and VERCEL_AI_GATEWAY_KEY must be set to use the Vercel AI Gateway provider.",
        "vercel_gateway",
        undefined,
        false
      );
    }

    // Route through Vercel AI Gateway by overriding baseURL on the Anthropic client.
    // The gateway accepts the same API shape as Anthropic but adds caching/analytics.
    this.client = createAnthropic({
      apiKey:  gatewayKey,
      baseURL: gatewayUrl,
    });
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startMs = Date.now();
    const modelId = this.resolveModel(request);

    try {
      const result = await generateText({
        // Strip the "anthropic/" prefix if the underlying SDK model ID doesn't use it.
        // createAnthropic() expects just the model ID part (e.g. "claude-3-5-haiku-20241022").
        model:       this.client(modelId.replace(/^anthropic\//, "")),
        system:      request.system,
        prompt:      request.prompt,
        temperature: request.temperature ?? 0.4,
        maxOutputTokens: request.maxTokens ?? 600,
      });

      return {
        text:     result.text,
        model:    modelId,
        provider: "vercel_gateway",
        usage: result.usage
          ? {
              inputTokens:  result.usage.inputTokens  ?? 0,
              outputTokens: result.usage.outputTokens ?? 0,
              totalTokens:  (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
            }
          : undefined,
        latencyMs: Date.now() - startMs,
      };

    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      const e = err as { status?: number; message?: string; statusCode?: number };
      const status = e.status ?? e.statusCode;
      throw new AIProviderError(
        `Vercel AI Gateway error [${modelId}]: ${e.message ?? "Unknown error"}`,
        "vercel_gateway",
        status,
        status === 429 || status === 503 || status === 529
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generate({
        prompt:    "Reply with OK.",
        maxTokens: 5,
        callSite:  "health_check",
      });
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private resolveModel(request: AIRequest): string {
    if (request.model) return request.model;
    // Use richer model for full explanations — haiku for everything else
    if (request.callSite?.includes("explanation") || request.callSite?.includes("recommend")) {
      return EXPLANATION_MODEL;
    }
    return DEFAULT_MODEL;
  }
}
