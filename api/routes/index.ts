/**
 * @module api/routes/index
 *
 * Root router — registers all sub-routers with their prefixes.
 *
 * URL structure:
 *   GET  /api/health
 *   GET  /api/dashboard/:studentId
 *   GET  /api/curriculum
 *   GET  /api/topic/:topicId
 *   GET  /api/weak-areas/:studentId
 *   GET  /api/progress/:studentId
 *   GET  /api/daily-quests/:studentId
 *   GET  /api/gamification/dashboard
 *   POST /api/practice/start
 *   POST /api/practice/submit
 *   POST /api/practice/hint
 *   POST /api/practice/explanation
 *   GET  /api/profile                ← NEW
 *   PATCH /api/profile               ← NEW
 *   GET  /api/practice/menu          ← NEW
 *   POST /api/tutor/ask              ← NEW
 *   GET  /api/student/memory              ← Wave 5
 *   POST /api/student/memory/refresh     ← Wave 5
 *   PATCH /api/student/interests         ← Wave 5
 *   POST /api/internal/generate-topics   ← service-to-service, secret header
 *   POST /api/profile/regenerate-topics  ← authenticated user action
 *   POST /api/profile/request-topic      ← authenticated user action
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

export default router;
