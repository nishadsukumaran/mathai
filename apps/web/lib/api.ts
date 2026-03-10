/**
 * @module apps/web/lib/api
 *
 * Shared helpers for calling the Express API from server components.
 *
 * In server components, we pull the raw NextAuth session cookie and
 * forward it as the Authorization Bearer token so the Express API can
 * verify it with the shared NEXTAUTH_SECRET.
 *
 * Falls back to "dev-stub" when no session cookie is present (local
 * development before OAuth is wired up).
 */

import { cookies } from "next/headers";

export const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001/api";

/**
 * Returns the Authorization header value for Express API requests.
 * In production this is the raw NextAuth JWE session token from the cookie.
 * In dev without a session it falls back to "dev-stub" (accepted by the stub middleware).
 */
export async function getAuthHeader(): Promise<string> {
  // Next.js 15: cookies() is async
  const cookieStore = await cookies();

  // NextAuth stores the session token in one of these cookies depending on HTTPS
  const sessionToken =
    cookieStore.get("__Secure-next-auth.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  return `Bearer ${sessionToken ?? "dev-stub"}`;
}

/**
 * Typed API fetch wrapper for server components.
 * Automatically attaches auth header and handles response envelope.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  const url = `${API_BASE}${path}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s — Render free tier cold start

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: await getAuthHeader(),
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[apiFetch] ${res.status} ${res.statusText} — ${url}`);
      return null;
    }

    const json = (await res.json()) as { success: boolean; data: T };
    if (!json.success) {
      console.error(`[apiFetch] API returned success=false — ${url}`);
    }
    return json.success ? json.data : null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[apiFetch] fetch failed — ${url} — ${message}`);
    return null;
  }
}
