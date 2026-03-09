/**
 * @module api/lib/response
 *
 * Typed response builder helpers.
 * All controllers must go through these — never build raw response objects.
 *
 * Enforces the canonical shape:
 *   success  { success: true,  data: T,   meta?: M }
 *   failure  { success: false, error: { code, message, details? } }
 *
 * Usage:
 *   res.json(ok(data))
 *   res.status(201).json(created(data))
 *   res.status(404).json(fail("NOT_FOUND", "Topic not found"))
 */

import type { Response } from "express";
import type { ApiSuccess, ApiError, ApiErrorDetail } from "@/types";

// ─── Success builders ─────────────────────────────────────────────────────────

export function ok<T, M = unknown>(data: T, meta?: M): ApiSuccess<T, M> {
  const envelope: ApiSuccess<T, M> = { success: true, data };
  if (meta !== undefined) envelope.meta = meta;
  return envelope;
}

export function created<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

// ─── Error builders ───────────────────────────────────────────────────────────

export function fail(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  const error: ApiErrorDetail = { code, message };
  if (details !== undefined) error.details = details;
  return { success: false, error };
}

// ─── Pagination meta ──────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page:  number;
  limit: number;
  hasMore: boolean;
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiSuccess<T[], PaginationMeta> {
  return ok(data, {
    total,
    page,
    limit,
    hasMore: page * limit < total,
  });
}

// ─── Convenience send helpers ─────────────────────────────────────────────────

/** Send a 200 OK with data. */
export function send<T>(res: Response, data: T, meta?: unknown): void {
  res.json(ok(data, meta));
}

/** Send a 201 Created with data. */
export function sendCreated<T>(res: Response, data: T): void {
  res.status(201).json(created(data));
}

/** Send a 204 No Content. */
export function sendNoContent(res: Response): void {
  res.status(204).end();
}
