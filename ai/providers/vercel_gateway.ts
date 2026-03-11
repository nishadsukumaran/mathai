/**
 * @module ai/providers/vercel_gateway
 *
 * MathAI AI provider — Vercel AI Gateway (production).
 *
 * ALL AI calls in production route through Vercel AI Gateway using the
 * official @ai-sdk/gateway package (createGateway / createGatewayProvider).
 *
 * ─── WHAT VERCEL AI GATEWAY PROVIDES ───────────────────────────────────────
 *
 *   - Unified API across 100+ models (Anthropic, OpenAI, Google, Meta, etc.)
 *   - Built-in caching, rate limiting, and observability
 *   - Spend controls and usage analytics via the Vercel dashboard
 *   - BYOK (Bring Your Own Key) — add provider keys in Vercel AI Gateway settings
 *   - OIDC auth when deployed to Vercel (no API key required in that case)
 *
 * ─── ACTIVATION ─────────────────────────────────────────────────────────────
 *
 * Required env vars (set in Render dashboard for the API service):
 *
 *   AI_PROVIDER=vercel_gateway
 *   AI_GATEWAY_API_KEY=<key-from-vercel-ai-gateway-settings>
 *
 * Optional overrides:
 *
 *   AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1/ai  (default — omit unless proxying)
 *   AI_MODEL_DEFAULT=anthropic/claude-haiku-4.5             (fast, cheap — hints/questions)
 *   AI_MODEL_EXPLANATION=anthropic/claude-sonnet-4.5        (rich — explanations/recommendations)
 *
 * ─── AUTH ────────────────────────────────────────────────────────────────────
 *
 *   The API key is sent as an Authorization: Bearer <key> header.
 *   On Vercel deployments, OIDC authentication is also supported — if no
 *   AI_GATEWAY_API_KEY is set, the SDK will attempt OIDC automatically.
 *   For Render (non-Vercel) deployments, AI_GATEWAY_API_KEY is required.
 *
 * ─── HOW TO GET YOUR KEY ─────────────────────────────────────────────────────
 *
 *   1. Go to vercel.com/dashboard → AI (left sidebar) → Create Gateway
 *   2. In Gateway settings → Authentication → Create API Key
 *   3. Paste the key as AI_GATEWAY_API_KEY in Render environment variables
 *   4. In Gateway settings → Providers → Add Anthropic → paste your Anthropic key (BYOK)
 *
 * ─── MODEL IDs ───────────────────────────────────────────────────────────────
 *
 *   Format: <provider>/<model-name>  (no date suffixes — gateway resolves to latest)
 *
 *   anthropic/claude-haiku-4.5     → fast, cheap (questions, hints, quick checks)
 *   anthropic/claude-sonnet-4.5    → smart (explanations, recommendations)
 *   anthropic/claude-sonnet-4.6    → smartest Sonnet (premium tasks)
 *   anthropic/claude-3.7-sonnet    → extended-thinking capable
 *   openai/gpt-4o-mini             → alternative fast model
 *   meta/llama-3.3-70b             → open-source option
 *
 *   Full catalog: vercel.com/ai-gateway/models
 */

import { generateText } from "ai";
import { createGateway, GatewayRateLimitError, GatewayAuthenticationError } from "@ai-sdk/gateway";
import type { AIProvider, AIRequest, AIResponse } from "./types";
import { AIProviderError } from "./types";

// ─── Model config ──────────────────────────────────────────────────────────────
// Gateway model IDs verified against @ai-sdk/gateway v3 GatewayModelId catalog.

const DEFAULT_MODEL     = process.env["AI_MODEL_DEFAULT"]     ?? "anthropic/claude-haiku-4.5";
const EXPLANATION_MODEL = process.env["AI_MODEL_EXPLANATION"] ?? "anthropic/claude-sonnet-4.5";

// ─── Provider ──────────────────────────────────────────────────────────────────

export class VercelGatewayProvider implements AIProvider {
  readonly name = "vercel_gateway" as const;

  private readonly gateway;

  constructor() {
    const apiKey  = process.env["AI_GATEWAY_API_KEY"];
    const baseURL = process.env["AI_GATEWAY_BASE_URL"]; // optional; defaults to https://ai-gateway.vercel.sh/v1/ai

    // apiKey is required on non-Vercel deployments (e.g. Render).
    // On Vercel, OIDC is used automatically when no key is present — but we validate
    // here to fail fast with a useful message rather than a mysterious 401 later.
    if (!apiKey) {
      throw new AIProviderError(
        "AI_GATEWAY_API_KEY is not set. Add it to your Render environment variables. " +
        "Get it from: vercel.com/dashboard → AI → your gateway → Authentication → Create API Key.",
        "vercel_gateway",
        undefined,
        false
      );
    }

    // createGateway is the official @ai-sdk/gateway factory.
    // baseURL defaults to https://ai-gateway.vercel.sh/v1/ai — we only override if
    // AI_GATEWAY_BASE_URL is explicitly set (e.g. testing against a different environment).
    this.gateway = createGateway({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startMs = Date.now();
    const modelId = this.resolveModel(request);

    try {
      const result = await generateText({
        // Pass the full "provider/model" ID directly — no prefix stripping needed.
        // The gateway handles routing to the upstream provider.
        model:           this.gateway(modelId),
        system:          request.system,
        prompt:          request.prompt,
        temperature:     request.temperature ?? 0.4,
        maxOutputTokens: request.maxTokens   ?? 600,
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

      // Map @ai-sdk/gateway typed errors to our AIProviderError
      if (err instanceof GatewayRateLimitError) {
        throw new AIProviderError(
          `Vercel AI Gateway rate limit exceeded [${modelId}]. Retrying…`,
          "vercel_gateway",
          429,
          true // retryable
        );
      }

      if (err instanceof GatewayAuthenticationError) {
        throw new AIProviderError(
          "Vercel AI Gateway authentication failed. Check AI_GATEWAY_API_KEY in your Render env vars.",
          "vercel_gateway",
          401,
          false // not retryable — misconfiguration
        );
      }

      const e = err as { status?: number; statusCode?: number; message?: string };
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

  // ─── Private helpers ────────────────────────────────────────────────────────

  private resolveModel(request: AIRequest): string {
    if (request.model) return request.model;
    // Use richer model for full explanations and recommendations; haiku for everything else
    if (request.callSite?.includes("explanation") || request.callSite?.includes("recommend")) {
      return EXPLANATION_MODEL;
    }
    return DEFAULT_MODEL;
  }
}
