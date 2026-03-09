import { Router } from "express";
import { getDailyQuestsForStudent } from "../controllers/questController";

const router = Router();
router.get("/:studentId", getDailyQuestsForStudent);
export default router;
