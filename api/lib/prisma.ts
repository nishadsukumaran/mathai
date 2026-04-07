/**
 * @module api/lib/prisma
 *
 * Prisma client singleton. Prevents multiple PrismaClient instances
 * in development (hot-reloading) and gives the entire API a single
 * database connection pool.
 *
 * Prisma 7+ requires passing the database URL via the datasourceUrl
 * constructor option since url/directUrl are no longer supported in schema.prisma.
 *
 * Usage:
 *   import { prisma } from "@/api/lib/prisma";
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
