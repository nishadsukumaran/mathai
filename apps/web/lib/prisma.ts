/**
 * @module apps/web/lib/prisma
 *
 * Shared PrismaClient singleton for the Next.js app.
 *
 * Next.js hot-reload in development causes module re-evaluation,
 * which would create a new PrismaClient (and a new connection pool)
 * on every reload without this singleton pattern.
 *
 * Prisma 7+ requires passing the database URL via the datasourceUrl
 * constructor option since url/directUrl are no longer supported in schema.prisma.
 *
 * See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env["NODE_ENV"] === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
