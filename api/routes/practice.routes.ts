import { Router } from "express";
import {
  startPractice,
  submitPracticeAnswer,
  getPracticeHint,
  getPracticeExplanation,
} from "../controllers/practiceController";

const router = Router();

router.post("/start",       startPractice);
router.post("/submit",      submitPracticeAnswer);
router.post("/hint",        getPracticeHint);
router.post("/explanation", getPracticeExplanation);

export default router;
