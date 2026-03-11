/**
 * @module ai/providers/types
 *
 * Core types for the MathAI AI provider abstraction layer.
 *
 * All AI calls in the system go through the AIProvider interface.
 * Concrete implementations live in:
 *   - anthropic.ts — Claude via Vercel AI SDK (activate in production)
 *   - mock.ts      — Deterministic responses for tests + template-only mode
 *
 * Engineers adding new providers only need to implement AIProvider.
 */

// ─── Request ──────────────────────────────────────────────────────────────────

export interface AIRequest {
  /** The main user/instruction prompt */
  prompt: string;

  /** Optional system-level instruction prepended to the conversation */
  system?: string;

  /** Sampling temperature — 0.0 (deterministic) to 1.0 (creative) */
  temperature?: number;

  /** Max output tokens. Default varies per provider. */
  maxTokens?: number;

  /**
   * Output format hint.
   * - "text"  → plain prose, used by hint/explanation engines
   * - "json"  → structured JSON, provider must enforce (or use JSON mode if supported)
   */
  responseFormat?: "text" | "json";

  /**
   * Override the default model for this specific call.
   * Use only when you need a cheaper/faster model for a specific task.
   * Default is controlled by AI_MODEL_DEFAULT env var.
   */
  model?: string;

  /**
   * Optional identifier for logging and observability.
   * e.g. "hint_engine.generate", "explanation_engine.generate"
   */
  callSite?: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface AIResponse {
  /** The generated text content */
  text: string;

  /** Model identifier that produced this response */
  model: string;

  /** Provider name — "anthropic", "openai", "mock", etc. */
  provider: string;

  /** Token usage — available from real providers, null from mock */
  usage?: {
    inputTokens:  number;
    outputTokens: number;
    totalTokens:  number;
  };

  /** Latency in ms — useful for performance tracking */
  latencyMs?: number;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;

  /**
   * Generate a text response from the AI model.
   * Throws AIProviderError on failure.
   */
  generate(request: AIRequest): Promise<AIResponse>;

  /**
   * Optional health check — returns true if the provider is reachable.
   * Used on startup to validate configuration.
   */
  healthCheck?(): Promise<boolean>;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider:    string,
    public statusCode?: number,
    public retryable:   boolean = false
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class AIParseError extends Error {
  constructor(message: string, public raw: string) {
    super(message);
    this.name = "AIParseError";
  }
}

// ─── Provider registry ────────────────────────────────────────────────────────
// Used by config.ts to list available providers

export type ProviderName = "vercel_gateway" | "anthropic" | "openai" | "mock";
