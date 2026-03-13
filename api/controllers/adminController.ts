/**
 * @module api/controllers/adminController
 *
 * HTTP handlers for admin routes.
 * All handlers assume authMiddleware + requireAdmin have already run.
 */

import { Request, Response, NextFunction } from "express";
import { z }                                from "zod";
import { send }                             from "../lib/response";
import { NotFoundError }                   from "../middlewares/error.middleware";
import * as adminService                   from "../services/adminService";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const ListUsersSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  search:   z.string().max(100).optional(),
  role:     z.enum(["student", "parent", "teacher", "admin"]).optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

const UpdateUserSchema = z.object({
  name:       z.string().min(1).max(80).optional(),
  email:      z.string().email().optional(),
  role:       z.enum(["student", "parent", "teacher", "admin"]).optional(),
  gradeLevel: z.string().max(10).nullable().optional(),
});

const DisableUserSchema = z.object({
  reason: z.string().max(500).optional(),
});

const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128)
    .regex(/[a-zA-Z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .optional(),
});

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
    const parsed = ListUsersSchema.parse(req.query);

    const { users, total } = await adminService.listUsers({
      search:   parsed.search?.trim() || undefined,
      role:     parsed.role,
      isActive: parsed.isActive,
      page:     parsed.page,
      limit:    parsed.limit,
    });

    const totalPages = Math.ceil(total / parsed.limit);
    send(res, { items: users, total, page: parsed.page, limit: parsed.limit, totalPages });
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
    const parsed = UpdateUserSchema.parse(req.body);
    const updated = await adminService.updateUser(req.params["id"]!, parsed);
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
    const parsed = DisableUserSchema.parse(req.body);
    await adminService.disableUser(req.params["id"]!, parsed.reason);
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
    const parsed = ResetPasswordSchema.parse(req.body);

    const temporaryPassword = await adminService.resetPassword(
      req.params["id"]!,
      parsed.newPassword?.trim()
    );
    send(res, {
      message: "Password reset successfully",
      temporaryPassword,
    });
  } catch (err) {
    next(err);
  }
}
