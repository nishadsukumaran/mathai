import { Router } from "express";
import { getProgress } from "../controllers/progressController";

const router = Router();
router.get("/:studentId", getProgress);
export default router;
