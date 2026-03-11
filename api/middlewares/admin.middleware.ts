/**
 * @module api/middlewares/admin.middleware
 *
 * Role gate for admin-only routes.
 * Must be used AFTER authMiddleware, which populates req.student.
 *
 * Usage:
 *   router.use(authMiddleware, requireAdmin);
 *   router.get("/admin/users", requireAdmin, listUsers);
 */

import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "./error.middleware";

/**
 * Blocks any request where req.student.role !== "admin".
 * Returns 403 Forbidden — deliberately gives no info about what the
 * correct role should be to avoid role-enumeration attacks.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.student?.role !== "admin") {
    return next(new ForbiddenError("Admin access required"));
  }
  next();
}
