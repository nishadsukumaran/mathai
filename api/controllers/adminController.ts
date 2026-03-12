/**
 * @module api/controllers/adminController
 *
 * HTTP handlers for admin routes.
 * All handlers assume authMiddleware + requireAdmin have already run.
 */

import { Request, Response, NextFunction } from "express";
import { send }                             from "../lib/response";
import { NotFoundError }                   from "../middlewares/error.middleware";
import * as adminService                   from "../services/adminService";

// ── GET /api/admin/dashboard ───────────────────────────────────────────────

export async function getDashboard(
  _req: Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();
    send(res, stats);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/users ───────────────────────────────────────────────────

export async function listUsers(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const page  = Math.max(1, parseInt(req.query["page"]  as string ?? "1",  10) || 1);
    const limit = Math.min(100, parseInt(req.query["limit"] as string ?? "20", 10) || 20);

    const isActiveParam = req.query["isActive"] as string | undefined;
    const isActive =
      isActiveParam === "true"  ? true  :
      isActiveParam === "false" ? false :
      undefined;

    const { users, total } = await adminService.listUsers({
      search:   (req.query["search"] as string | undefined)?.trim() || undefined,
      role:     (req.query["role"]   as string | undefined) || undefined,
      isActive,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    send(res, { items: users, total, page, limit, totalPages });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/users/:id ───────────────────────────────────────────────

export async function getUserDetail(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await adminService.getUserById(req.params["id"]!);
    if (!user) throw new NotFoundError("User not found");
    send(res, user);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/users/:id ─────────────────────────────────────────────

export async function updateUser(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, role, gradeLevel } = req.body as Record<string, unknown>;
    const updated = await adminService.updateUser(req.params["id"]!, {
      ...(name       !== undefined && { name:       String(name) }),
      ...(email      !== undefined && { email:      String(email) }),
      ...(role       !== undefined && { role:       String(role) }),
      ...(gradeLevel !== undefined && { gradeLevel: gradeLevel === null ? null : String(gradeLevel) }),
    });
    if (!updated) throw new NotFoundError("User not found");
    send(res, updated);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/users/:id/disable ─────────────────────────────────────

export async function disableUser(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const { reason } = req.body as { reason?: string };
    await adminService.disableUser(req.params["id"]!, reason);
    send(res, { message: "User disabled" });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/users/:id/enable ──────────────────────────────────────

export async function enableUser(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    await adminService.enableUser(req.params["id"]!);
    send(res, { message: "User enabled" });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/users/:id/reset-password ──────────────────────────────

export async function resetPassword(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    // Optional: admin can supply a specific password instead of auto-generating.
    const newPassword = (req.body?.newPassword as string | undefined)?.trim() || undefined;

    if (newPassword !== undefined) {
      // Validate complexity: min 8 chars, at least one letter, at least one number
      if (newPassword.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters." });
        return;
      }
      if (!/[a-zA-Z]/.test(newPassword)) {
        res.status(400).json({ error: "Password must contain at least one letter." });
        return;
      }
      if (!/[0-9]/.test(newPassword)) {
        res.status(400).json({ error: "Password must contain at least one number." });
        return;
      }
    }

    const temporaryPassword = await adminService.resetPassword(req.params["id"]!, newPassword);
    send(res, {
      message: "Password reset successfully",
      temporaryPassword,
    });
  } catch (err) {
    next(err);
  }
}
