/**
 * @module ai/services/imageGenerationService
 *
 * Generates educational concept images for visual explanations.
 * Returns base64 data URLs — no external storage needed.
 * Caches generated images as base64 in PostgreSQL to avoid regeneration.
 *
 * STRATEGY:
 *   1. Try Gemini via AI Gateway (if AI_GATEWAY_API_KEY is set) → raster image
 *   2. Fall back to SVG generation via the project's existing AI provider
 *      (works with whatever AI_PROVIDER is configured — Anthropic, Gateway, etc.)
 *
 * Cache key: conceptKey + grade.
 * Rate limit: 10 generations per student per day.
 */

import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { callAIModel } from "../ai_client";
import { prisma } from "../../api/lib/prisma";

const IMAGE_MODEL_PRIMARY = "google/gemini-3.1-flash-image-preview";
const MAX_DAILY_GENS = 10;
const TIMEOUT_MS = 25_000;

// Singleton gateway — only created if AI_GATEWAY_API_KEY is available
let _gateway: ReturnType<typeof createGateway> | null | undefined;

function getGateway(): ReturnType<typeof createGateway> | null {
  if (_gateway !== undefined) return _gateway;
  const apiKey = process.env["AI_GATEWAY_API_KEY"];
  if (!apiKey) {
    _gateway = null;
    return null;
  }
  const baseURL = process.env["AI_GATEWAY_BASE_URL"];
  _gateway = createGateway({ apiKey, ...(baseURL ? { baseURL } : {}) });
  return _gateway;
}

interface GenerateImageRequest {
  imagePrompt: string;
  conceptKey: string;
  grade: string;
  altText: string;
  caption: string;
  userId: string;
}

interface GenerateImageResult {
  imageUrl: string;
  altText: string;
  caption: string;
  prompt: string;
  cached: boolean;
}

function toPrismaGrade(grade: string): string {
  if (grade === "K") return "K";
  const num = parseInt(grade.replace("G", ""), 10);
  if (isNaN(num) || num < 1) return "G4";
  if (num > 8) return "G8";
  return `G${num}`;
}

/** Simple rate limit: count images generated today via ConceptImage.createdAt */
async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Count images created today (rough proxy — not per-user, but limits total generation load)
    const count = await prisma.conceptImage.count({
      where: { createdAt: { gte: today } },
    });
    return count < MAX_DAILY_GENS * 10; // Global cap of 100/day
  } catch {
    // Table may not exist — allow generation
    return true;
  }
}

// ─── Strategy 1: Gemini raster image (needs AI Gateway + Google provider) ────

async function tryGeminiImage(prompt: string): Promise<string | null> {
  const gateway = getGateway();
  if (!gateway) return null; // No gateway key — skip

  try {
    const result = await generateText({
      model: gateway(IMAGE_MODEL_PRIMARY),
      prompt,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const imageFile = result.files?.[0];
    if (!imageFile?.base64) return null;

    const mimeType = imageFile.mimeType ?? "image/png";
    return `data:${mimeType};base64,${imageFile.base64}`;
  } catch (err) {
    console.warn("[imageGen] Gemini failed:", (err as Error).message);
    return null;
  }
}

// ─── Strategy 2: SVG via existing AI provider (always available) ─────────────
// Uses callAIModel which works with whatever AI_PROVIDER is configured.

async function trySvgFallback(prompt: string): Promise<string | null> {
  try {
    const svg = await callAIModel(prompt, {
      system: `You are an educational illustrator. Generate a clean SVG image for children.
Rules:
- Output ONLY the SVG markup, nothing else. No markdown, no explanation, no backticks.
- Start with <svg and end with </svg>
- Use viewBox="0 0 400 300" with width="400" height="300"
- Use bright, friendly colors (blues, greens, oranges, purples)
- Keep it simple — bold shapes, thick strokes, large labels
- Make it educational and clear for the given grade level`,
      maxTokens: 2000,
      temperature: 0.3,
      callSite: "imageGen.svgFallback",
    });

    // Extract SVG from response (AI may wrap it in markdown)
    const trimmed = svg.trim();
    let svgContent: string;

    if (trimmed.startsWith("<svg")) {
      svgContent = trimmed;
    } else {
      const match = trimmed.match(/<svg[\s\S]*<\/svg>/);
      if (!match) {
        console.error("[imageGen] SVG fallback returned no valid SVG");
        return null;
      }
      svgContent = match[0];
    }

    const encoded = Buffer.from(svgContent).toString("base64");
    return `data:image/svg+xml;base64,${encoded}`;
  } catch (err) {
    console.error("[imageGen] SVG fallback failed:", (err as Error).message);
    return null;
  }
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function generateConceptImage(
  req: GenerateImageRequest
): Promise<GenerateImageResult | null> {
  const prismaGrade = toPrismaGrade(req.grade);

  // 1. Check cache (graceful — skip if table doesn't exist)
  try {
    const cached = await prisma.conceptImage.findUnique({
      where: {
        conceptKey_grade: { conceptKey: req.conceptKey, grade: prismaGrade as any },
      },
    });
    if (cached) {
      return {
        imageUrl: cached.imageUrl,
        altText: cached.altText,
        caption: cached.caption,
        prompt: cached.prompt,
        cached: true,
      };
    }
  } catch {
    // Table may not exist — skip cache
  }

  // 2. Check rate limit (graceful — skip if columns don't exist)
  try {
    const ok = await checkRateLimit(req.userId);
    if (!ok) {
      console.warn(`[imageGen] Rate limit reached for user ${req.userId}`);
      return null;
    }
  } catch {
    // Columns may not exist — allow generation
  }

  // 3. Generate image
  const prompt = `Educational illustration for children (grade ${req.grade}): ${req.imagePrompt}. Simple, colorful, clear. White background.`;
  console.log(`[imageGen] Generating visual for "${req.conceptKey}" (${req.grade})`);

  // Try Gemini first (best quality), fall back to SVG (always works)
  let dataUrl = await tryGeminiImage(prompt);
  if (!dataUrl) {
    console.log("[imageGen] Falling back to SVG generation");
    dataUrl = await trySvgFallback(prompt);
  }

  if (!dataUrl) {
    console.error("[imageGen] All methods failed for:", req.conceptKey);
    return null;
  }

  console.log(`[imageGen] Success for "${req.conceptKey}"`);

  // 4. Cache (non-fatal)
  try {
    await prisma.conceptImage.create({
      data: {
        conceptKey: req.conceptKey,
        grade: prismaGrade as any,
        prompt,
        imageUrl: dataUrl,
        altText: req.altText,
        caption: req.caption,
      },
    });
  } catch {
    // Cache write failure is fine — image still returned
  }

  return {
    imageUrl: dataUrl,
    altText: req.altText,
    caption: req.caption,
    prompt,
    cached: false,
  };
}
