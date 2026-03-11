/**
 * @module api/routes/student.routes
 *
 * Student memory & personalisation endpoints.
 *
 *   GET  /api/student/memory          — return the authenticated student's
 *                                       memory snapshot (cached, TTL 2h)
 *   POST /api/student/memory/refresh  — force-rebuild the snapshot now
 *   PATCH /api/student/interests      — update the student's interest keywords
 *
 * All routes require auth (set upstream in routes/index.ts).
 */

import { Router, Request, Response, NextFunction } from "express";
import { z }                        from "zod";
import { studentMemoryService }     from "../../ai/services/studentMemoryService";
import { prisma }                   from "../lib/prisma";
import { NotFoundError }            from "../middlewares/error.middleware";

const router = Router();

// ─── GET /api/student/memory ─────────────────────────────────────────────────

router.get("/memory", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundError("User", userId);

    const snapshot = await studentMemoryService.getSnapshot(userId);

    res.json({ success: true, data: snapshot });
  } catch (err) { next(err); }
});

// ─── POST /api/student/memory/refresh ────────────────────────────────────────

router.post("/memory/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const snapshot = await studentMemoryService.refreshSnapshot(userId);

    res.json({
      success: true,
      data:    snapshot,
      meta:    { refreshedAt: snapshot.lastRefreshedAt },
    });
  } catch (err) { next(err); }
});

// ─── PATCH /api/student/interests ────────────────────────────────────────────

const InterestsSchema = z.object({
  interests: z.array(z.string().min(1).max(50)).min(1).max(10),
});

router.patch("/interests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsed = InterestsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const { interests } = parsed.data;

    // Persist interests on StudentProfile (comma-separated string).
    // Use raw SQL because Prisma client types don't include the new `interests`
    // column until `prisma generate` is re-run against the migrated schema.
    await prisma.$executeRaw`
      INSERT INTO student_profiles ("userId", interests, "createdAt", "updatedAt")
      VALUES (${userId}, ${interests.join(",")}, NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET interests = ${interests.join(",")}, "updatedAt" = NOW()
    `;

    // Invalidate snapshot so next fetch picks up the new interests
    await studentMemoryService.refreshSnapshot(userId).catch(() => undefined);

    res.json({ success: true, data: { interests } });
  } catch (err) { next(err); }
});

export default router;
