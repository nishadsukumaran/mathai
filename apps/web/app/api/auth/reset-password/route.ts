/**
 * @module apps/web/app/api/auth/reset-password
 *
 * POST /api/auth/reset-password
 *
 * Accepts { token, email, password } and, if the token is valid and
 * unexpired, updates the user's hashed password and deletes the token.
 */

import { NextResponse } from "next/server";
import bcrypt           from "bcryptjs";
import { prisma }       from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token    = (body?.token    as string | undefined)?.trim();
    const email    = (body?.email    as string | undefined)?.toLowerCase().trim();
    const password = (body?.password as string | undefined);

    // ── Input validation ──────────────────────────────────────────────────
    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and new password are all required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter." },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number." },
        { status: 400 }
      );
    }

    // ── Token lookup ──────────────────────────────────────────────────────
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.identifier !== email) {
      return NextResponse.json(
        { error: "This reset link is invalid. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      // Clean up the expired token
      await prisma.verificationToken
        .delete({ where: { token } })
        .catch(() => {});
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Update password ───────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data:  { hashedPassword },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset-password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
