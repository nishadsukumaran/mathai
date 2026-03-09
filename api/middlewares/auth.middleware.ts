/**
 * @module api/middlewares/auth.middleware
 *
 * Authentication middleware. Validates the NextAuth JWE session token.
 *
 * FLOW:
 *   1. Extract Bearer token from Authorization header
 *   2. In production: decrypt NextAuth JWT using NEXTAUTH_SECRET + jose + hkdf
 *   3. In development: accept "dev-stub" token and use URL param as userId
 *   4. Attach decoded student payload to req.student
 *   5. Call next() to continue to the controller
 */

import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "./error.middleware";
import { jwtDecrypt } from "jose";
import hkdf from "@panva/hkdf";

export interface AuthenticatedStudent {
  id: string;
  grade: string;
  roles: string[];
}

// Extend Express Request to include student
declare global {
  namespace Express {
    interface Request {
      student?: AuthenticatedStudent;
    }
  }
}

const NEXTAUTH_SECRET = process.env["NEXTAUTH_SECRET"] ?? "";
const IS_DEV = process.env["NODE_ENV"] !== "production";

/**
 * Derives the encryption key from the NEXTAUTH_SECRET using HKDF,
 * matching exactly how NextAuth v4 generates its JWE encryption key.
 */
async function getDerivedEncryptionKey(secret: string): Promise<Uint8Array> {
  return hkdf("sha256", secret, "", "NextAuth.js Generated Encryption Key", 32);
}

/**
 * Decodes a NextAuth v4 JWE session token.
 * Returns the JWT payload or null if invalid/expired.
 */
async function decodeNextAuthToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    if (!NEXTAUTH_SECRET) return null;
    const encryptionKey = await getDerivedEncryptionKey(NEXTAUTH_SECRET);
    const { payload } = await jwtDecrypt(token, encryptionKey, {
      clockTolerance: 15,
    });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Validates the request token and attaches student context to the request.
 * Returns 401 if token is missing or invalid (in production).
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError();
    }

    // Dev mode: accept "dev-stub" or any non-JWT token — use URL params for identity
    if (IS_DEV && (token === "dev-stub" || !token.includes("."))) {
      const studentId =
        (req.params["studentId"] as string | undefined) ?? "user-alice-001";
      req.student = {
        id: studentId,
        grade: "G4",
        roles: ["student"],
      };
      return next();
    }

    // Production (and dev with real JWT): decode NextAuth JWE token
    const payload = await decodeNextAuthToken(token);

    if (!payload) {
      throw new UnauthorizedError();
    }

    const userId = (payload["sub"] as string | undefined) ?? "";
    if (!userId) {
      throw new UnauthorizedError();
    }

    req.student = {
      id: userId,
      grade: (payload["grade"] as string | undefined) ?? "G4",
      roles: (payload["roles"] as string[] | undefined) ?? ["student"],
    };

    next();
  } catch (err) {
    next(err);
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7) || null;
}
