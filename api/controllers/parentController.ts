/**
 * @module api/controllers/parentController
 *
 * GET /api/parent/dashboard/:childId — parent portal dashboard for a child
 *
 * All handlers assume authMiddleware + requireParent have already run.
 */

import { Request, Response, NextFunction } from "express";
import { z }    from "zod";
import { send } from "../lib/response";
import { getParentDashboard } from "../services/parentDashboardService";

const ChildIdSchema = z.object({
  childId: z.string().min(1),
});

/** GET /api/parent/dashboard/:childId */
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { childId } = ChildIdSchema.parse(req.params);
    const data = await getParentDashboard(childId);
    send(res, data);
  } catch (err) {
    next(err);
  }
}
