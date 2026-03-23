/**
 * @module ai/services/imageGenerationService
 *
 * Generates educational concept images via Vercel AI Gateway.
 * Returns base64 data URLs — no external storage needed.
 * Caches generated images as base64 in PostgreSQL to avoid regeneration.
 *
 * Model: google/gemini-3.1-flash-image-preview (cost-effective multimodal).
 * Cache key: conceptKey + grade (one image per concept per grade level).
 * Rate limit: 10 generations per student per day.
 */

import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { prisma } from "../../api/lib/prisma";

// Cost-effective image model via AI Gateway
const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";
const MAX_DAILY_GENS = 10;
const TIMEOUT_MS = 20_000;

// Reuse the same gateway config as vercel_gateway.ts
function getGateway() {
  const apiKey = process.env["AI_GATEWAY_API_KEY"];
  const baseURL = process.env["AI_GATEWAY_BASE_URL"];
  if (!apiKey) {
    throw new Error(
      "[imageGen] AI_GATEWAY_API_KEY is not set. Cannot generate images."
    );
  }
  return createGateway({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
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
  imageUrl: string;  // base64 data URL (data:image/png;base64,...)
  altText: string;
  caption: string;
  prompt: string;
  cached: boolean;
}

/** Map frontend Grade string to the Prisma Grade enum value string. */
function toPrismaGrade(grade: string): string {
  if (grade === "K") return "K";
  const num = parseInt(grade.replace("G", ""), 10);
  if (isNaN(num) || num < 1) return "G4";
  if (num > 8) return "G8";
  return `G${num}`;
}

/** Check + increment daily rate limit. Returns true if within limit. */
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

export async function generateConceptImage(
  req: GenerateImageRequest
): Promise<GenerateImageResult | null> {
  const prismaGrade = toPrismaGrade(req.grade);

  // 1. Check cache (imageUrl stores base64 data URL)
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

  // 3. Generate image via AI Gateway
  try {
    const gateway = getGateway();
    const prompt = `Educational illustration for children (grade ${req.grade}): ${req.imagePrompt}. Simple, colorful, clear. White background. No text in image.`;

    const result = await generateText({
      model: gateway(IMAGE_MODEL),
      prompt,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Gemini returns images in result.files
    const imageFile = result.files?.[0];
    if (!imageFile) {
      console.error("[imageGen] No image file in AI response. Model may not support image output.");
      return null;
    }

    // 4. Convert to base64 data URL
    const base64 = imageFile.base64;
    if (!base64) {
      console.error("[imageGen] Image file has no base64 data");
      return null;
    }

    const mimeType = imageFile.mimeType ?? "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 5. Cache in DB (store the full data URL)
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

    return {
      imageUrl: dataUrl,
      altText: req.altText,
      caption: req.caption,
      prompt,
      cached: false,
    };
  } catch (error) {
    console.error("[imageGen] Generation failed:", error);
    return null;
  }
}
