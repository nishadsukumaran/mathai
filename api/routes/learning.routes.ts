import { Router } from "express";
import { getNextAction } from "../controllers/learningController";

const router = Router();

router.get("/next", getNextAction);

export default router;
