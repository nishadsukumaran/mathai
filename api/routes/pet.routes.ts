/**
 * @module api/routes/pet
 *
 * Pet system endpoints.
 *
 * GET  /api/pet            — get student's current pet + personality
 * POST /api/pet/adopt      — adopt a pet (or rename current pet)
 * GET  /api/pet/catalog    — list all available pets
 * GET  /api/pet/insight    — parent-facing personality insight message
 * POST /api/pet/evaluate   — manually trigger personality re-evaluation
 */

import { Router } from "express";
import { z } from "zod";
import { getPetResponse, adoptPet, evaluateAndUpdatePersonality } from "../services/petService";
import { PET_CATALOG } from "../../services/gamification/pet_personality_engine";
import { prisma } from "../lib/prisma";

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const AdoptPetSchema = z.object({
  petId:   z.string().min(1, "petId is required"),
  petName: z.string().max(50).optional(),
});

// ── GET /api/pet ──────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    // Fetch current level for unlock computation (default 1 for new users)
    const profile      = await prisma.studentProfile.findUnique({ where: { userId } });
    const currentLevel = profile?.currentLevel ?? 1;

    const response = await getPetResponse(userId, "Student", currentLevel);
    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/pet/catalog ──────────────────────────────────────────────────────
router.get("/catalog", (_req, res) => {
  res.json({ success: true, data: PET_CATALOG });
});

// ── GET /api/pet/insight ──────────────────────────────────────────────────────
// Parent-facing: returns just the insight message string
router.get("/insight", async (req, res, next) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const profile      = await prisma.studentProfile.findUnique({ where: { userId } });
    const currentLevel = profile?.currentLevel ?? 1;

    const response = await getPetResponse(userId, "your child", currentLevel);
    res.json({ success: true, data: { insight: response.insight, personality: response.effects } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pet/adopt ───────────────────────────────────────────────────────
router.post("/adopt", async (req, res, next) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const parsed = AdoptPetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const pet = await adoptPet(userId, parsed.data.petId, parsed.data.petName);
    res.json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pet/evaluate ────────────────────────────────────────────────────
// Manually trigger a personality evaluation (useful for testing / forced refresh)
router.post("/evaluate", async (req, res, next) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }

    const updated = await evaluateAndUpdatePersonality(userId);
    res.json({ success: true, data: updated ?? { message: "No evaluation needed yet" } });
  } catch (err) {
    next(err);
  }
});

export default router;
