/**
 * @module lib/security/turnstile
 *
 * Server-side Cloudflare Turnstile token verification.
 *
 * Verifies tokens via Cloudflare's siteverify endpoint.
 * Never trusts frontend-only verification.
 *
 * ENV:
 *   TURNSTILE_SECRET_KEY — Cloudflare Turnstile secret key
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — public site key (used by frontend widget)
 *
 * LOCAL DEV:
 *   If TURNSTILE_SECRET_KEY is not set, verification is skipped with a warning.
 *   This allows local development without Cloudflare credentials.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  error?:  string;
}

/**
 * Verify a Turnstile token server-side.
 *
 * @param token - The cf-turnstile-response token from the frontend widget
 * @param ip    - The client IP (optional, for additional validation)
 * @returns { success: true } or { success: false, error: string }
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<TurnstileResult> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];

  // Local dev bypass: if no secret key is configured, skip verification
  if (!secret) {
    if (process.env["NODE_ENV"] === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY not set in production!");
      return { success: false, error: "Security configuration error" };
    }
    // Dev/test: warn but allow through
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Verification required" };
  }

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json() as { success: boolean; "error-codes"?: string[] };

    if (data.success) {
      return { success: true };
    }

    return { success: false, error: "Verification failed" };
  } catch {
    // Network error calling Cloudflare — fail open in dev, closed in prod
    if (process.env["NODE_ENV"] === "production") {
      return { success: false, error: "Verification service unavailable" };
    }
    return { success: true };
  }
}
