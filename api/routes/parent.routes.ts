import { Router }          from "express";
import { requireParent }   from "../middlewares/parent.middleware";
import { getDashboard }    from "../controllers/parentController";

const router = Router();

router.use(requireParent);

router.get("/dashboard/:childId", getDashboard);

export default router;
