import path from "node:path";
import type { PrismaConfig } from "prisma";

export default {
  earlyAccess: true,
  schema: path.join("database", "schema", "schema.prisma"),

  migrate: {
    async development() {
      return {
        url: process.env.DATABASE_URL!,
        directUrl: process.env.DIRECT_URL,
      };
    },
  },
} satisfies PrismaConfig;
