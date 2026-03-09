import { Router } from "express";
import { getGamification } from "../controllers/gamificationController";

const router = Router();
router.get("/dashboard", getGamification);
export default router;
