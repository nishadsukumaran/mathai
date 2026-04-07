import path from "node:path";

export default {
  schema: path.join("database", "schema", "schema.prisma"),
  migrate: {
    async development() {
      return {
        url: process.env.DATABASE_URL!,
      };
    },
  },
};
