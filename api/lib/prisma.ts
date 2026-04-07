/**
 * @module api/lib/prisma
 *
 * Prisma client singleton. Prevents multiple PrismaClient instances
 * in development (hot-reloading) and gives the entire API a single
 * database connection pool.
 *
 * Prisma 7+ requires passing the database URL via the adapter or accelerateUrl
 * constructor option since url/directUrl are no longer supported in schema.prisma.
 *
 * Usage:
 *   import { prisma } from "@/api/lib/prisma";
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
