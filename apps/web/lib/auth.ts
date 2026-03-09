/**
 * @module apps/web/lib/auth
 *
 * NextAuth.js configuration.
 * Supports Google OAuth for parent/teacher accounts.
 * Email magic link available when EMAIL_SERVER is configured.
 *
 * Providers are conditionally included — app won't crash if env vars
 * are missing in dev. Set them in .env.local to activate.
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Build provider list dynamically based on what's configured
const providers: NextAuthOptions["providers"] = [];

// Google OAuth — requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.local
if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
  providers.push(
    GoogleProvider({
      clientId: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      authorization: {
        params: {
          // Request offline access for refresh tokens
          access_type: "offline",
          prompt: "consent",
        },
      },
      // Increase OIDC discovery timeout — default 3500ms is too short on
      // busy dev servers (event loop lag can cause premature AbortSignal fires)
      httpOptions: {
        timeout: 15000,
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (token?.sub) {
        session.user = {
          ...session.user,
          // @ts-ignore — extend session type
          id: token.sub,
        };
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env["NEXTAUTH_SECRET"],
};
