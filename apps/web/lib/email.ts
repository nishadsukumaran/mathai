/**
 * @module apps/web/lib/email
 *
 * Thin email abstraction over nodemailer.
 *
 * Configuration (env vars):
 *   EMAIL_SERVER_HOST   — SMTP host  e.g. smtp.sendgrid.net
 *   EMAIL_SERVER_PORT   — SMTP port  e.g. 587
 *   EMAIL_SERVER_USER   — SMTP user  (often "apikey" for SendGrid)
 *   EMAIL_SERVER_PASS   — SMTP pass / API key
 *   EMAIL_FROM          — Sender address  e.g. "MathAI <no-reply@mathai.app>"
 *
 * In development (NODE_ENV !== "production") the email is NOT sent via SMTP;
 * instead the full reset / verification URL is printed to the server console
 * and returned in the API response body so developers can test without
 * configuring an SMTP server.
 */

import nodemailer from "nodemailer";

const IS_DEV = process.env["NODE_ENV"] !== "production";

// ── Transporter ──────────────────────────────────────────────────────────────

function createTransport() {
  const host = process.env["EMAIL_SERVER_HOST"];
  const port = parseInt(process.env["EMAIL_SERVER_PORT"] ?? "587", 10);
  const user = process.env["EMAIL_SERVER_USER"];
  const pass = process.env["EMAIL_SERVER_PASS"];

  if (!host || !user || !pass) {
    if (!IS_DEV) {
      throw new Error(
        "Email is not configured. Set EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASS."
      );
    }
    // Dev: return a mock transporter that does nothing
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({ host, port, auth: { user, pass } });
}

const FROM =
  process.env["EMAIL_FROM"] ?? "MathAI <no-reply@mathai.app>";

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a password-reset email.
 *
 * @returns `devUrl` — in development, the reset URL the user should visit.
 *                     Always `undefined` in production.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ devUrl?: string }> {
  if (IS_DEV) {
    console.log("\n──────────────────────────────────────────────────────────");
    console.log("  🔑  PASSWORD RESET LINK (development — email not sent)");
    console.log("  →", resetUrl);
    console.log("──────────────────────────────────────────────────────────\n");
    return { devUrl: resetUrl };
  }

  const transport = createTransport();

  await transport.sendMail({
    from: FROM,
    to,
    subject: "Reset your MathAI password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;">🧮</div>
          <h1 style="color:#4f46e5;margin:8px 0 0;">MathAI</h1>
        </div>
        <h2 style="color:#1e293b;font-size:20px;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#64748b;line-height:1.6;margin-bottom:24px;">
          Someone (hopefully you!) requested a password reset for this account.
          Click the button below to choose a new password. The link expires in
          <strong>1 hour</strong>.
        </p>
        <a
          href="${resetUrl}"
          style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                 padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;"
        >
          Reset Password
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:32px;">
          If you didn't request this, you can safely ignore this email.
          Your password will not change.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#94a3b8;font-size:12px;text-align:center;">
          MathAI · Helping every student master maths
        </p>
      </div>
    `,
    text: `Reset your MathAI password\n\nVisit this link to reset your password:\n${resetUrl}\n\nThe link expires in 1 hour. If you didn't request this, ignore this email.`,
  });

  return {};
}
