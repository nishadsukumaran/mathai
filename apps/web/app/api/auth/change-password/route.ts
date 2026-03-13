/**
 * @module apps/web/app/api/auth/change-password
 *
 * PATCH /api/auth/change-password
 *
 * Authenticated endpoint — changes a user's password.
 * Requires { currentPassword, newPassword }.
 */

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import bcrypt              from "bcryptjs";
import { authOptions }     from "@/lib/auth";
import { prisma }          from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = (body?.currentPassword as string | undefined)?.trim();
    const newPassword     = (body?.newPassword     as string | undefined)?.trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must contain at least one letter." },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must contain at least one number." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // OAuth-only accounts (no hashedPassword) can't use this endpoint
    if (!user.hashedPassword) {
      return NextResponse.json(
        {
          error:
            "Your account was created with Google sign-in and doesn't have a password. " +
            "Sign in with Google to access your account.",
        },
        { status: 400 }
      );
    }

    // Verify the current password
    const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Don't allow setting the same password
    const isSame = await bcrypt.compare(newPassword, user.hashedPassword);
    if (isSame) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data:  { hashedPassword },
    });

    return NextResponse.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change-password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
