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
import { getPetResponse, adoptPet, evaluateAndUpdatePersonality } from "../services/petService";
import { PET_CATALOG } from "../../services/gamification/pet_personality_engine";

const router = Router();

// ── GET /api/pet ──────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    // @ts-ignore — userId injected by authMiddleware
    const userId = req.userId as string;
    // @ts-ignore
    const name   = (req.user?.name as string) ?? "Student";

    const response = await getPetResponse(userId, name);
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
    // @ts-ignore
    const userId = req.userId as string;
    // @ts-ignore
    const name   = (req.user?.name as string) ?? "your child";

    const response = await getPetResponse(userId, name);
    res.json({ success: true, data: { insight: response.insight, personality: response.effects } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pet/adopt ───────────────────────────────────────────────────────
router.post("/adopt", async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.userId as string;
    const { petId, petName } = req.body as { petId?: string; petName?: string };

    if (!petId) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "petId is required" } });
      return;
    }

    const pet = await adoptPet(userId, petId, petName);
    res.json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pet/evaluate ────────────────────────────────────────────────────
// Manually trigger a personality evaluation (useful for testing / forced refresh)
router.post("/evaluate", async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.userId as string;
    const updated = await evaluateAndUpdatePersonality(userId);
    res.json({ success: true, data: updated ?? { message: "No evaluation needed yet" } });
  } catch (err) {
    next(err);
  }
});

export default router;
