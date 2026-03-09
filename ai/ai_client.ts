/**
 * @module ai/ai_client
 *
 * Thin wrapper around the AI provider layer.
 * Preserves the original callAIModel() signature so all existing call-sites
 * (hint_engine, explanation_engine, etc.) require zero changes.
 *
 * ARCHITECTURE:
 *   callAIModel() → aiProvider.generate() → [AnthropicProvider | MockProvider]
 *
 *   The active provider is selected from AI_PROVIDER env var:
 *     AI_PROVIDER=mock       → no API calls, returns canned responses (default)
 *     AI_PROVIDER=anthropic  → calls Claude via Vercel AI SDK
 *
 * DIRECT PROVIDER ACCESS:
 *   For engines that need the full AIResponse (token counts, latency), import
 *   the provider singleton directly:
 *
 *     import { aiProvider } from "./providers";
 *     const response = await aiProvider.generate({ prompt, system, callSite: "hint_engine" });
 *
 * STRUCTURED JSON:
 *   Use callAIModelJSON<T>() or parseStructuredJSON<T>() after a "json" format call.
 */

import { aiProvider }      from "./providers";
import { AIParseError as ProviderParseError } from "./providers";
export { AIProviderError } from "./providers";
export type { AIProvider, AIRequest, AIResponse } from "./providers";

// ─── Options type ─────────────────────────────────────────────────────────────

export interface AIModelOptions {
  system?:         string;
  temperature?:    number;
  maxTokens?:      number;
  responseFormat?: "text" | "json";
  model?:          string;
  /** Identifies the caller for logging and observability */
  callSite?:       string;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Sends a prompt to the configured AI provider and returns the text response.
 *
 * @param prompt  — the main instruction / user message
 * @param options — system prompt, temperature, token limit, model override, callSite
 * @returns       — the generated text string
 * @throws        — AIProviderError on unrecoverable failure (re-exported from providers)
 *
 * @example
 * // In hint_engine.ts — when moving beyond template-only hints:
 * const hintText = await callAIModel(
 *   buildHintPrompt(question, conceptTags),
 *   { system: TUTOR_SYSTEM_PROMPT, maxTokens: 300, callSite: "hint_engine.generate" }
 * );
 */
export async function callAIModel(
  prompt:  string,
  options: AIModelOptions = {}
): Promise<string> {
  const response = await aiProvider.generate({
    prompt,
    system:         options.system,
    temperature:    options.temperature    ?? 0.5,
    maxTokens:      options.maxTokens      ?? 600,
    responseFormat: options.responseFormat ?? "text",
    model:          options.model,
    callSite:       options.callSite,
  });
  return response.text;
}

/**
 * Calls the AI model expecting a JSON response and parses the output.
 * Strips markdown fences (```json...```) that models sometimes include.
 *
 * @example
 * const result = await callAIModelJSON<{ steps: string[] }>(
 *   "List the steps to add 1/4 + 2/4 as JSON with a 'steps' array.",
 *   { callSite: "explanation_engine.steps" }
 * );
 */
export async function callAIModelJSON<T>(
  prompt:  string,
  options: Omit<AIModelOptions, "responseFormat"> = {}
): Promise<T> {
  const raw = await callAIModel(prompt, { ...options, responseFormat: "json" });
  return parseStructuredJSON<T>(raw);
}

// ─── JSON parse helper ────────────────────────────────────────────────────────

/**
 * Safely parses a JSON string from AI output.
 * Strips markdown code fences if the model wraps its JSON.
 *
 * @throws AIParseError if the string is not valid JSON
 */
export function parseStructuredJSON<T>(raw: string): T {
  try {
    const cleaned = raw
      .replace(/^```json\s*/m, "")
      .replace(/^```\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new AIParseError(
      `Failed to parse AI JSON response: ${String(err)}\n\nRaw output:\n${raw}`
    );
  }
}

// ─── Error classes ────────────────────────────────────────────────────────────

export class AIParseError extends Error {
  constructor(message: string, public raw?: string) {
    super(message);
    this.name = "AIParseError";
  }
}

// AIModelError is an alias for AIProviderError (backwards compat)
export { AIProviderError as AIModelError } from "./providers";

// Suppress unused import warning — ProviderParseError is kept for future use
const _unused = ProviderParseError;
void _unused;
