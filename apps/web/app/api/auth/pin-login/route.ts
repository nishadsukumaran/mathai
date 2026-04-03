/**
 * @module apps/web/app/api/auth/pin-login
 *
 * POST /api/auth/pin-login — authenticate a child via username + PIN.
 *
 * Returns a session token that the frontend uses to sign in via NextAuth
 * credentials provider. Does NOT create a session directly — the frontend
 * calls signIn("credentials", { username, pin }) which routes through
 * the NextAuth credentials provider.
 *
 * This endpoint validates the PIN and returns the child's info for
 * the NextAuth callback to consume.
 */

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import bcrypt           from "bcryptjs";
import { checkRateLimit, getClientIp, PIN_LOGIN_LIMIT } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { username, pin } = body as { username: string; pin: string };

    if (!username || !pin) {
      return NextResponse.json({ error: "Username and PIN are required" }, { status: 400 });
    }

    // Rate limit: 5 attempts per 10 minutes per IP+username
    const rateKey = `pin:${ip}:${username.toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateKey, PIN_LOGIN_LIMIT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    // Find student profile by username
    const profile = await prisma.studentProfile.findUnique({
      where:   { username: username.toLowerCase().trim() },
      include: {
        user: { select: { id: true, name: true, email: true, gradeLevel: true, isActive: true, role: true } },
      },
    });

    if (!profile || !profile.hashedPin || !profile.user.isActive) {
      return NextResponse.json({ error: "Invalid username or PIN" }, { status: 401 });
    }

    // Check login mode allows PIN
    const mode = profile.preferredLoginMode;
    if (mode !== "pin_only" && mode !== "hybrid") {
      return NextResponse.json({ error: "PIN login is not enabled for this account" }, { status: 403 });
    }

    // Verify PIN
    const valid = await bcrypt.compare(pin, profile.hashedPin);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or PIN" }, { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: profile.user.id },
      data:  { lastLoginAt: new Date() },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: {
        id:    profile.user.id,
        name:  profile.user.name,
        email: profile.user.email,
        grade: profile.user.gradeLevel,
        role:  profile.user.role,
      },
    });

  } catch (err) {
    console.error("[pin-login] Error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
