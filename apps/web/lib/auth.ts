/**
 * @module apps/web/lib/auth
 *
 * NextAuth.js configuration.
 * Supports:
 *   1. Email + password credentials (always available)
 *   2. Google OAuth (when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set)
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Build provider list dynamically
const providers: NextAuthOptions["providers"] = [];

// ── Credentials (email + password) ──────────────────────────────────────────
providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.hashedPassword) return null;

      const isValid = await bcrypt.compare(
        credentials.password,
        user.hashedPassword
      );

      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatarUrl,
      };
    },
  })
);

// ── Google OAuth (optional) ─────────────────────────────────────────────────
if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
  providers.push(
    GoogleProvider({
      clientId: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
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
          id:    token.sub,
          grade: (token["grade"] as string | undefined) ?? "G4",
        };
      }
      return session;
    },
    jwt: async ({ token, user, trigger, session: updateSession }) => {
      if (user) {
        // Initial sign-in: embed the student's gradeLevel into the JWT so
        // the Express API auth middleware can read it without a DB call.
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where:  { id: user.id },
          select: { gradeLevel: true },
        });
        token["grade"] = dbUser?.gradeLevel ?? "G4";
      }

      // Handle client-side session.update({ grade: "G5" }) calls —
      // triggered from the profile page after a grade change is saved.
      if (trigger === "update" && (updateSession as Record<string, unknown>)?.["grade"]) {
        token["grade"] = (updateSession as Record<string, unknown>)["grade"];
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
