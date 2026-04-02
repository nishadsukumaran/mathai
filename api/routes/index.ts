/**
 * @module api/routes/index
 *
 * Root router — registers all sub-routers with their prefixes.
 * See docs/frontend-api-contracts.md for full endpoint reference.
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { prisma } from "../lib/prisma";
import practiceRoutes     from "./practice.routes";
import curriculumRoutes   from "./curriculum.routes";
import progressRoutes     from "./progress.routes";
import gamificationRoutes from "./gamification.routes";
import dashboardRoutes    from "./dashboard.routes";
import questRoutes        from "./quest.routes";
import profileRoutes      from "./profile.routes";
import practiceMenuRoutes from "./practiceMenu.routes";
import tutorRoutes        from "./tutor.routes";
import studentRoutes      from "./student.routes";
import adminRoutes        from "./admin.routes";
import internalRoutes     from "./internal.routes";
import petRoutes          from "./pet.routes";
import learningRoutes     from "./learning.routes";
import parentRoutes       from "./parent.routes";

const router = Router();

// ── Health check (no auth) ────────────────────────────────────────────────────
router.get("/health", async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch { /* db unreachable */ }

  const status = dbOk ? "ok" : "degraded";
  const code   = dbOk ? 200 : 503;

  res.status(code).json({
    success: dbOk,
    data: {
      status,
      db:        dbOk ? "connected" : "unreachable",
      version:   process.env["npm_package_version"] ?? "0.1.0",
      env:       process.env["NODE_ENV"] ?? "development",
      uptime:    Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Internal service routes (no user JWT — secret header required) ───────────
router.use("/internal", internalRoutes);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.use(authMiddleware);

router.use("/dashboard",      dashboardRoutes);
router.use("/practice",       practiceRoutes);
router.use("/practice",       practiceMenuRoutes);  // GET /practice/menu
router.use("/curriculum",     curriculumRoutes);
router.use("/progress",       progressRoutes);
router.use("/gamification",   gamificationRoutes);
router.use("/daily-quests",   questRoutes);
router.use("/profile",        profileRoutes);       // GET+PATCH /profile
router.use("/tutor",          tutorRoutes);          // POST /tutor/ask
router.use("/student",        studentRoutes);         // GET /student/memory, POST /student/memory/refresh, PATCH /student/interests
router.use("/admin",          adminRoutes);           // admin-only; requireAdmin runs inside admin.routes.ts
router.use("/pet",            petRoutes);             // GET /pet, POST /pet/adopt, GET /pet/catalog, GET /pet/insight
router.use("/learning",       learningRoutes);        // GET /learning/next — Learning Brain Engine
router.use("/parent",         parentRoutes);          // GET /parent/dashboard/:childId — Parent Portal

export default router;
