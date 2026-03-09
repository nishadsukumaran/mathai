/**
 * @module api/controllers/questController
 * GET /api/daily-quests/:studentId
 */

import { Request, Response, NextFunction } from "express";
import { StudentIdParamSchema } from "../validators/shared.validators";
import { getDailyQuests } from "../services/questService";
import { send } from "../lib/response";

export async function getDailyQuestsForStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);
    const quests = await getDailyQuests(studentId);
    send(res, quests, { count: quests.length, date: new Date().toISOString().split("T")[0] });
  } catch (err) {
    next(err);
  }
}
