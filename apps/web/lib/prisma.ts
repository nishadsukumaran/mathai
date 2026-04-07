/**
 * @module apps/web/lib/prisma
 *
 * Shared PrismaClient singleton for the Next.js app.
 *
 * Next.js hot-reload in development causes module re-evaluation,
 * which would create a new PrismaClient (and a new connection pool)
 * on every reload without this singleton pattern.
 *
 * Prisma 7+ requires passing the database URL via the adapter or accelerateUrl
 * constructor option since url/directUrl are no longer supported in schema.prisma.
 *
 * See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env["DATABASE_URL"];
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
