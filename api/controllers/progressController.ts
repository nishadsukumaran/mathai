/**
 * @module api/controllers/progressController
 * GET /api/progress/:studentId
 */

import { Request, Response, NextFunction } from "express";
import { StudentIdParamSchema } from "../validators/shared.validators";
import { getProgressSummary } from "../services/progressService";
import { send } from "../lib/response";
import { ForbiddenError } from "../middlewares/error.middleware";

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);

    // Authorization: students can only access their own progress
    if (req.student?.id !== studentId && req.student?.role !== "admin") {
      throw new ForbiddenError("Cannot access another student's progress");
    }

    const summary = await getProgressSummary(studentId);
    send(res, summary);
  } catch (err) {
    next(err);
  }
}
