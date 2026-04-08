/**
 * @module api/lib/prisma
 *
 * Prisma client singleton. Prevents multiple PrismaClient instances
 * in development (hot-reloading) and gives the entire API a single
 * database connection pool.
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
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
