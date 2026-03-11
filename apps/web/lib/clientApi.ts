/**
 * @module apps/web/lib/clientApi
 *
 * Client-side fetch helpers for "use client" components.
 *
 * Auth: the NextAuth session cookie is sent automatically by the browser
 * on same-origin requests, but the Express API is on a different origin.
 * We read the session token from NextAuth's client-side session and pass
 * it as a Bearer token — same approach as server-side apiFetch.
 *
 * Usage:
 *   const profile = await clientGet<StudentProfileResponse>("/profile");
 *   await clientPatch("/profile", { learningPace: "fast" });
 *   const result  = await clientPost<TutorResponse>("/tutor/ask", body);
 */

import { getSession } from "next-auth/react";

export const API_BASE =
  process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001/api";

async function getToken(): Promise<string> {
  try {
    const session = await getSession();
    // next-auth returns the raw token on the session object when
    // callbacks.jwt passes it through. The Express API accepts it as Bearer.
    const token = (session as Record<string, unknown> | null)?.["accessToken"] as string | undefined;
    return `Bearer ${token ?? "dev-stub"}`;
  } catch {
    return "Bearer dev-stub";
  }
}

async function clientFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T | null> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization:  await getToken(),
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      console.error(`[clientApi] ${method} ${res.status} — ${url}`);
      return null;
    }

    const json = (await res.json()) as { success: boolean; data: T };
    return json.success ? json.data : null;
  } catch (err) {
    console.error(`[clientApi] ${method} failed — ${url}`, err);
    return null;
  }
}

export const clientGet  = <T>(path: string)              => clientFetch<T>("GET",   path);
export const clientPost = <T>(path: string, body: unknown) => clientFetch<T>("POST",  path, body);
export const clientPatch= <T>(path: string, body: unknown) => clientFetch<T>("PATCH", path, body);
