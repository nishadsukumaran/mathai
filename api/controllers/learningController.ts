/**
 * @module api/controllers/learningController
 *
 * GET /api/learning/next — returns the student's next best learning action
 * as decided by the Learning Brain Engine.
 */

import { Request, Response, NextFunction } from "express";
import { getNextLearningAction } from "../services/learningBrain";
import { send }                  from "../lib/response";

export async function getNextAction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.student?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      return;
    }

    const action = await getNextLearningAction(userId);

    if (!action) {
      // Brand-new student with no topics yet — return a helpful null result
      send(res, null);
      return;
    }

    send(res, action);
  } catch (err) {
    next(err);
  }
}
