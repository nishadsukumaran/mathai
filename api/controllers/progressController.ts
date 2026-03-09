/**
 * @module api/controllers/progressController
 * GET /api/progress/:studentId
 */

import { Request, Response, NextFunction } from "express";
import { StudentIdParamSchema } from "../validators/shared.validators";
import { getProgressSummary } from "../services/progressService";
import { send } from "../lib/response";

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);
    const summary = await getProgressSummary(studentId);
    send(res, summary);
  } catch (err) {
    next(err);
  }
}
