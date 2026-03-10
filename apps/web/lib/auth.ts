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
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
