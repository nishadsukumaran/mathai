/**
 * @module api/routes/admin.routes
 *
 * Admin API routes — all protected by authMiddleware + requireAdmin.
 *
 * Mounted at /api/admin in routes/index.ts.
 *
 * Endpoints:
 *   GET  /api/admin/dashboard                  — platform stats
 *   GET  /api/admin/users                      — paginated user list
 *   GET  /api/admin/users/:id                  — user detail
 *   PATCH /api/admin/users/:id                 — update name/email/role/grade
 *   POST /api/admin/users/:id/disable          — soft-disable
 *   POST /api/admin/users/:id/enable           — re-enable
 *   POST /api/admin/users/:id/reset-password   — generate temp password
 */

import { Router }       from "express";
import { requireAdmin } from "../middlewares/admin.middleware";
import * as ctrl        from "../controllers/adminController";

const router = Router();

// Apply admin gate to all routes in this module.
// authMiddleware is already applied in routes/index.ts before mounting.
router.use(requireAdmin);

router.get("/dashboard",                    ctrl.getDashboard);
router.get("/users",                        ctrl.listUsers);
router.get("/users/:id",                    ctrl.getUserDetail);
router.patch("/users/:id",                  ctrl.updateUser);
router.post("/users/:id/disable",           ctrl.disableUser);
router.post("/users/:id/enable",            ctrl.enableUser);
router.post("/users/:id/reset-password",    ctrl.resetPassword);

export default router;
