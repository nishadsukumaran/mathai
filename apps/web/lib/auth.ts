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

      // Block disabled accounts at sign-in
      if (!user.isActive) return null;

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
          id:       token.sub,
          grade:    (token["grade"]    as string  | undefined) ?? "G4",
          role:     (token["role"]     as string  | undefined) ?? "student",
          isActive: (token["isActive"] as boolean | undefined) ?? true,
        };
      }
      return session;
    },
    jwt: async ({ token, user, trigger, session: updateSession }) => {
      if (user) {
        // Initial sign-in: embed gradeLevel, role, and isActive into the JWT
        // so the Express API can enforce role-based access without a DB call.
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where:  { id: user.id },
          select: { gradeLevel: true, role: true, isActive: true },
        });
        token["grade"]    = dbUser?.gradeLevel ?? "G4";
        token["role"]     = dbUser?.role       ?? "student";
        token["isActive"] = dbUser?.isActive   ?? true;

        // Update lastLoginAt on every sign-in
        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        }).catch(() => { /* non-critical — don't block login */ });
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
