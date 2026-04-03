/**
 * @module apps/web/app/api/auth/check-username
 *
 * GET /api/auth/check-username?username=aryan
 *
 * Checks if a username is available for child PIN login.
 * Returns { available: true/false, suggestion?: string }
 *
 * Rules:
 *   - 3-15 characters
 *   - lowercase letters, numbers, hyphens only
 *   - must start with a letter
 *   - no consecutive hyphens
 */

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

const USERNAME_REGEX = /^[a-z][a-z0-9-]{2,14}$/;

function isValidUsername(username: string): string | null {
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 15) return "Username must be 15 characters or less";
  if (!/^[a-z]/.test(username)) return "Username must start with a letter";
  if (!USERNAME_REGEX.test(username)) return "Only lowercase letters, numbers, and hyphens allowed";
  if (username.includes("--")) return "No consecutive hyphens";
  return null;
}

async function generateSuggestion(base: string): Promise<string> {
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "student";
  for (let i = 0; i < 5; i++) {
    const suffix = Math.floor(10 + Math.random() * 90); // 2 digits
    const suggestion = `${clean}${suffix}`;
    const exists = await prisma.studentProfile.findUnique({
      where: { username: suggestion }, select: { id: true },
    }).catch(() => null);
    if (!exists) return suggestion;
  }
  return `${clean}${Date.now().toString(36).slice(-3)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username")?.toLowerCase().trim() ?? "";

  if (!username) {
    return NextResponse.json({ available: false, error: "Username is required" });
  }

  const validationError = isValidUsername(username);
  if (validationError) {
    const suggestion = await generateSuggestion(username);
    return NextResponse.json({ available: false, error: validationError, suggestion });
  }

  try {
    const existing = await prisma.studentProfile.findUnique({
      where: { username }, select: { id: true },
    });

    if (existing) {
      const suggestion = await generateSuggestion(username);
      return NextResponse.json({ available: false, error: "Username already taken", suggestion });
    }

    return NextResponse.json({ available: true });
  } catch {
    return NextResponse.json({ available: false, error: "Could not check availability" });
  }
}
