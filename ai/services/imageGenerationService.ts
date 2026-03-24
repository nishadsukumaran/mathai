/**
 * @module ai/services/imageGenerationService
 *
 * Generates educational concept images via Vercel AI Gateway.
 * Returns base64 data URLs — no external storage needed.
 * Caches generated images as base64 in PostgreSQL to avoid regeneration.
 *
 * SMART MODEL ROUTING:
 *   Simple visuals (basic shapes, number concepts) → gemini-3.1-flash (cheapest)
 *   Complex visuals (multi-step diagrams, real-world scenes) → gemini-3.1-flash (still cheap, good quality)
 *   Fallback if Google unavailable → generates SVG via Anthropic Claude
 *
 * Cache key: conceptKey + grade (one image per concept per grade level).
 * Rate limit: 10 generations per student per day.
 *
 * PREREQUISITE: Add Google as a provider in Vercel AI Gateway:
 *   vercel.com/dashboard → AI → your gateway → Providers → Add Google
 *   Get a free API key at aistudio.google.com/apikey
 */

import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { prisma } from "../../api/lib/prisma";

// ─── Model routing ───────────────────────────────────────────────────────────
// Gemini Flash is the sweet spot: cheap ($0.075/1M input tokens) + image output.
// Falls back to Claude for SVG generation if Google provider isn't configured.

const IMAGE_MODEL_PRIMARY   = "google/gemini-3.1-flash-image-preview";
const FALLBACK_MODEL        = process.env["AI_MODEL_DEFAULT"] ?? "anthropic/claude-haiku-4.5";
const MAX_DAILY_GENS = 10;
const TIMEOUT_MS     = 25_000;

let _gateway: ReturnType<typeof createGateway> | null = null;

function getGateway() {
  if (_gateway) return _gateway;
  const apiKey = process.env["AI_GATEWAY_API_KEY"];
  const baseURL = process.env["AI_GATEWAY_BASE_URL"];
  if (!apiKey) {
    throw new Error("[imageGen] AI_GATEWAY_API_KEY is not set.");
  }
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
  imageUrl: string;  // base64 data URL or SVG data URL
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

async function checkRateLimit(userId: string): Promise<boolean> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { imageGensToday: true, imageGenDate: true },
  });
  if (!profile) return false;

  const today = new Date().toISOString().slice(0, 10);
  const lastDate = profile.imageGenDate?.toISOString().slice(0, 10);

  if (lastDate !== today) {
    await prisma.studentProfile.update({
      where: { userId },
      data: { imageGensToday: 1, imageGenDate: new Date() },
    });
    return true;
  }

  if (profile.imageGensToday >= MAX_DAILY_GENS) return false;

  await prisma.studentProfile.update({
    where: { userId },
    data: { imageGensToday: { increment: 1 } },
  });
  return true;
}

// ─── Primary: Gemini image generation ────────────────────────────────────────

async function tryGeminiImage(
  gateway: ReturnType<typeof createGateway>,
  prompt: string,
): Promise<string | null> {
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
    console.warn("[imageGen] Gemini failed, trying fallback:", (err as Error).message);
    return null;
  }
}

// ─── Fallback: Claude SVG generation ─────────────────────────────────────────
// If Google provider isn't in the gateway, use Claude to generate an SVG.
// SVGs are lightweight, render perfectly, and Claude is great at them.

async function tryClaudeSvg(
  gateway: ReturnType<typeof createGateway>,
  prompt: string,
): Promise<string | null> {
  try {
    const result = await generateText({
      model: gateway(FALLBACK_MODEL),
      system: `You are an educational illustrator. Generate a clean SVG image for children.
Rules:
- Output ONLY the SVG markup, nothing else. No markdown, no explanation.
- Start with <svg and end with </svg>
- Use viewBox="0 0 400 300" with width="400" height="300"
- Use bright, friendly colors (blues, greens, oranges, purples)
- Keep it simple — bold shapes, thick strokes, large text
- Make it educational and clear
- No external images or fonts`,
      prompt,
      maxOutputTokens: 2000,
      temperature: 0.3,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const svg = result.text.trim();
    if (!svg.startsWith("<svg")) {
      // Try to extract SVG from response
      const match = svg.match(/<svg[\s\S]*<\/svg>/);
      if (!match) return null;
      const encoded = Buffer.from(match[0]).toString("base64");
      return `data:image/svg+xml;base64,${encoded}`;
    }

    const encoded = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${encoded}`;
  } catch (err) {
    console.error("[imageGen] SVG fallback also failed:", (err as Error).message);
    return null;
  }
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function generateConceptImage(
  req: GenerateImageRequest
): Promise<GenerateImageResult | null> {
  const prismaGrade = toPrismaGrade(req.grade);

  // 1. Check cache
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

  // 2. Check rate limit
  const withinLimit = await checkRateLimit(req.userId);
  if (!withinLimit) {
    console.warn(`[imageGen] Rate limit reached for user ${req.userId}`);
    return null;
  }

  // 3. Generate — try Gemini first, fall back to Claude SVG
  const gateway = getGateway();
  const prompt = `Educational illustration for children (grade ${req.grade}): ${req.imagePrompt}. Simple, colorful, clear. White background. No text overlay on the image.`;

  let dataUrl = await tryGeminiImage(gateway, prompt);

  if (!dataUrl) {
    console.log("[imageGen] Gemini unavailable, falling back to Claude SVG");
    dataUrl = await tryClaudeSvg(gateway, prompt);
  }

  if (!dataUrl) {
    console.error("[imageGen] All generation methods failed");
    return null;
  }

  // 4. Cache in DB
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
  } catch (dbErr) {
    // Cache write failure is non-fatal — image still returned
    console.warn("[imageGen] Cache write failed (image still returned):", (dbErr as Error).message);
  }

  return {
    imageUrl: dataUrl,
    altText: req.altText,
    caption: req.caption,
    prompt,
    cached: false,
  };
}
