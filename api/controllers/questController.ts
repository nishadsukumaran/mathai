/**
 * @module api/controllers/questController
 * GET /api/daily-quests/:studentId
 */

import { Request, Response, NextFunction } from "express";
import { StudentIdParamSchema } from "../validators/shared.validators";
import { getDailyQuests } from "../services/questService";
import { send } from "../lib/response";
import { ForbiddenError } from "../middlewares/error.middleware";

export async function getDailyQuestsForStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);

    // Authorization: students can only access their own quests
    if (req.student?.id !== studentId && req.student?.role !== "admin") {
      throw new ForbiddenError("Cannot access another student's quests");
    }

    const quests = await getDailyQuests(studentId);
    send(res, quests, { count: quests.length, date: new Date().toISOString().split("T")[0] });
  } catch (err) {
    next(err);
  }
}
