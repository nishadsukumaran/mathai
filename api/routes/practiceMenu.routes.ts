/**
 * @module api/routes/practiceMenu.routes
 *
 *   GET /api/practice/menu   → PracticeMenu
 */

import { Router, Request, Response, NextFunction } from "express";
import { getPracticeMenu } from "../services/practiceMenuService";

const router = Router();

router.get("/menu", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.student?.id;
    if (!userId) { res.status(401).json({ success: false, error: "Unauthorized" }); return; }
    const menu = await getPracticeMenu(userId);
    res.json({ success: true, data: menu });
  } catch (err) { next(err); }
});

export default router;
