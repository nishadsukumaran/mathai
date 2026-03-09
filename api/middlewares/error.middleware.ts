/**
 * @module api/middlewares/error.middleware
 *
 * Global error handler — must be the LAST middleware registered in app.ts.
 * All controllers should call next(err) rather than building ad-hoc responses.
 *
 * ERROR CODES
 * ─────────────────────────────────────────────────────────────────────────────
 *   VALIDATION_ERROR   — Zod schema or manual validation failed (400)
 *   NOT_FOUND          — Resource not found (404)
 *   UNAUTHORIZED       — Missing / invalid auth token (401)
 *   FORBIDDEN          — Authenticated but insufficient permissions (403)
 *   CONFLICT           — Duplicate resource or state conflict (409)
 *   AI_ERROR           — AI model call failed (502)
 *   INTERNAL_ERROR     — Unexpected server error (500)
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { ApiError } from "@/types";
import { fail } from "../lib/response";

// ─── Error Classes ────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    // Capture stack in Node.js
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} '${id}' not found` : `${resource} not found`;
    super("NOT_FOUND", msg, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export class AIError extends AppError {
  constructor(message = "AI service unavailable", details?: unknown) {
    super("AI_ERROR", message, 502, details);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const body: ApiError = fail(
      "VALIDATION_ERROR",
      "Request validation failed",
      err.flatten()
    );
    res.status(400).json(body);
    return;
  }

  // ── Application errors ─────────────────────────────────────────────────────
  if (err instanceof AppError) {
    const body: ApiError = fail(err.code, err.message, err.details);
    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unknown errors — never leak internals in production ───────────────────
  const rawErr = err instanceof Error ? err : new Error(String(err));
  console.error("[error_middleware]", rawErr.message, rawErr.stack);

  const body: ApiError = fail(
    "INTERNAL_ERROR",
    process.env["NODE_ENV"] === "production"
      ? "An unexpected error occurred"
      : rawErr.message
  );
  res.status(500).json(body);
}
