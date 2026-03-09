/**
 * @module api/controllers/dashboardController
 * GET /api/dashboard/:studentId
 */

import { Request, Response, NextFunction } from "express";
import { StudentIdParamSchema } from "../validators/shared.validators";
import { getStudentWithProfile, getStreakForStudent } from "../services/studentService";
import { getGamificationDashboard } from "../services/gamificationService";
import { getDailyQuests } from "../services/questService";
import { getProgressSummary } from "../services/progressService";
import { send } from "../lib/response";

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);

    // Fetch in parallel — each piece is independent
    const [student, gamification, quests, progress] = await Promise.all([
      getStudentWithProfile(studentId),
      getGamificationDashboard(studentId),
      getDailyQuests(studentId),
      getProgressSummary(studentId),
    ]);

    const streak = await getStreakForStudent(studentId);

    send(res, {
      student: {
        id:         student.id,
        name:       student.name,
        grade:      student.gradeLevel,
        avatarUrl:  student.avatarUrl,
        weakAreas:  student.weakAreas.slice(0, 3),
        strongAreas: student.strongAreas.slice(0, 3),
      },
      gamification,
      quests,
      progress: {
        masteredTopics:  progress.masteredTopics,
        totalTopics:     progress.totalTopics,
        level:           progress.level,
        levelTitle:      progress.levelTitle,
        streak:          streak.currentStreak,
        xpToNextLevel:   progress.xpToNextLevel,
      },
    });
  } catch (err) {
    next(err);
  }
}
