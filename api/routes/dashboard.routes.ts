import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";

const router = Router();
router.get("/:studentId", getDashboard);
export default router;
