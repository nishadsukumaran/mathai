// Prisma 7 configuration file
// Using CommonJS-style export for maximum compatibility

module.exports = {
  schema: "database/schema/schema.prisma",
  migrate: {
    async development() {
      return {
        url: process.env.DATABASE_URL,
      };
    },
  },
};
