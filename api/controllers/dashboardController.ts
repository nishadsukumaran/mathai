/**
 * @module api/controllers/dashboardController
 * GET /api/dashboard/:studentId
 */

import { Request, Response, NextFunction } from "express";
import { StudentIdParamSchema } from "../validators/shared.validators";
import { getStudentWithProfile } from "../services/studentService";
import { getGamificationDashboard } from "../services/gamificationService";
import { getDailyQuests } from "../services/questService";
import { getProgressSummary } from "../services/progressService";
import { send } from "../lib/response";
import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError } from "../middlewares/error.middleware";

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);

    // ── Authorization: students can only access their own dashboard ─────────
    if (req.student?.id !== studentId && req.student?.role !== "admin") {
      throw new ForbiddenError("Cannot access another student's dashboard");
    }

    // ── 1. Fetch all shared data in a single parallel round-trip ────────────
    // Each service used to independently fetch profile/streak/topicProgress.
    // We do it once here and pass it down — eliminates 3× upsert duplicates
    // and 3× streak/topicProgress duplicate reads per request.
    const [user, profile, topicProgressRows, streak] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.studentProfile.upsert({
        where:  { userId: studentId },
        create: { userId: studentId },
        update: {},
      }),
      prisma.topicProgress.findMany({ where: { userId: studentId } }),
      prisma.streak.findUnique({ where: { userId: studentId } }),
    ]);

    if (!user) throw new NotFoundError("Student", studentId);

    const ctx = { user, profile, topicProgressRows, streak };

    // ── 2. Build each dashboard section in parallel (no duplicate DB calls) ──
    const [student, gamification, quests, progress] = await Promise.all([
      getStudentWithProfile(studentId, ctx),
      getGamificationDashboard(studentId, ctx),
      getDailyQuests(studentId),
      getProgressSummary(studentId, ctx),
    ]);

    send(res, {
      student: {
        id:          student.id,
        name:        student.name,
        grade:       student.grade,
        avatarUrl:   student.avatarUrl,
        weakAreas:   student.weakAreas.slice(0, 3),
        strongAreas: student.strongAreas.slice(0, 3),
      },
      gamification,
      quests,
      progress: {
        masteredTopics: progress.masteredTopics,
        totalTopics:    progress.totalTopics,
        level:          progress.level,
        levelTitle:     progress.levelTitle,
        streak:         progress.streak,
        xpToNextLevel:  progress.xpToNextLevel,
      },
    });
  } catch (err) {
    next(err);
  }
}
