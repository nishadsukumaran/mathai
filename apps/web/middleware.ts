/**
 * @module apps/web/middleware
 *
 * Next.js Edge Middleware — runs on every request before the route handler.
 *
 * Responsibilities:
 *   1. Protect /admin/* — redirect non-admins to /auth/signin
 *   2. Protect regular student routes — redirect unauthenticated users
 *
 * NOTE: We read the NextAuth JWT token directly here (using getToken) because
 * middleware runs in the Edge runtime and cannot do full DB calls.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIX     = "/admin";
const ADMIN_LOGIN_PATH = "/admin/login";
const SIGNIN_PATH      = "/auth/signin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin area protection ──────────────────────────────────────────────────
  if (pathname.startsWith(ADMIN_PREFIX)) {
    // Allow the login redirect page through
    if (pathname === ADMIN_LOGIN_PATH) return NextResponse.next();

    const token = await getToken({ req, secret: process.env["NEXTAUTH_SECRET"] });

    // Not logged in → go to signin with callbackUrl
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = SIGNIN_PATH;
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Logged in but not admin → 403 page
    if ((token["role"] as string | undefined) !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/403";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match /admin and everything under it
    "/admin/:path*",
  ],
};
