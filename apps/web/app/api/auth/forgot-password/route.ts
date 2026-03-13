/**
 * @module apps/web/app/api/auth/forgot-password
 *
 * POST /api/auth/forgot-password
 *
 * Accepts { email } and, if the email belongs to a credentials-based account,
 * creates a password-reset token (stored in the VerificationToken table) and
 * sends a reset email.
 *
 * SECURITY NOTES
 * • We always return 200 regardless of whether the email exists to prevent
 *   user enumeration.
 * • Tokens expire after 1 hour.
 * • We delete any existing reset token for this email before creating a new one
 *   so a user can't accumulate many valid tokens.
 * • Rate-limiting should be applied at the edge (e.g. Vercel middleware) in
 *   production; this route does not implement its own rate limiter.
 */

import { NextResponse }           from "next/server";
import crypto                     from "crypto";
import { prisma }                 from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  try {
    const body     = await req.json();
    const email    = (body?.email as string | undefined)?.toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Always respond with success to prevent user enumeration.
    // All work that depends on whether the user exists is done silently.
    const successResponse = (devUrl?: string) =>
      NextResponse.json({
        message:
          "If an account with that email exists, you'll receive a password reset link shortly.",
        // In development expose the link directly so it can be tested without SMTP.
        ...(devUrl ? { devResetUrl: devUrl } : {}),
      });

    // Look up the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return successResponse();

    // Accounts created via OAuth (Google etc.) don't have a hashedPassword and
    // can't use the password reset flow. Silently skip.
    if (!user.hashedPassword) return successResponse();

    // Delete any existing token for this email
    await prisma.verificationToken
      .deleteMany({ where: { identifier: email } })
      .catch(() => {/* non-critical */});

    // Generate a cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires  = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await prisma.verificationToken.create({
      data: { identifier: email, token: rawToken, expires },
    });

    // Build the reset URL
    const appUrl =
      process.env["NEXTAUTH_URL"] ??
      process.env["NEXT_PUBLIC_APP_URL"] ??
      "http://localhost:3000";

    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Send email (or log in dev)
    const { devUrl } = await sendPasswordResetEmail(email, resetUrl);

    return successResponse(devUrl);
  } catch (err) {
    console.error("Forgot-password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
