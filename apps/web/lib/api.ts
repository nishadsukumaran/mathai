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
export function getAuthHeader(): string {
  const cookieStore = cookies();

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
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: T };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
