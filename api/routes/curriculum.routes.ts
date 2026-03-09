import { Router } from "express";
import {
  getCurriculum,
  getTopic,
  getWeakAreasForStudent,
} from "../controllers/curriculumController";

const router = Router();

router.get("/",                       getCurriculum);
router.get("/weak-areas/:studentId",  getWeakAreasForStudent);
router.get("/topic/:topicId",         getTopic);

export default router;
