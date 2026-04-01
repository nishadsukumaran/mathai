/**
 * @module api/middlewares/parent.middleware
 *
 * Role gate for parent-only routes.
 * Must be used AFTER authMiddleware, which populates req.student.
 *
 * Allows access if the user's role is "parent" or "admin" (admins can
 * view any child's data too).
 */

import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "./error.middleware";

export function requireParent(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const role = req.student?.role;
  if (role !== "parent" && role !== "admin") {
    return next(new ForbiddenError("Parent access required"));
  }
  next();
}
