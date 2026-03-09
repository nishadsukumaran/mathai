/**
 * @module api/controllers/gamificationController
 * GET /api/gamification/dashboard
 */

import { Request, Response, NextFunction } from "express";
import { getGamificationDashboard } from "../services/gamificationService";
import { send } from "../lib/response";

export async function getGamification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId  = req.student!.id;
    const dashboard = await getGamificationDashboard(userId);
    send(res, dashboard);
  } catch (err) {
    next(err);
  }
}
