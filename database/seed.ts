/**
 * @module database/seed
 *
 * Seeds the database with a default admin account.
 * Run: npx ts-node database/seed.ts
 * Or:  npx tsx database/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@mathai.app";
  const adminPassword = "admin123"; // Change in production!

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Admin account already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      hashedPassword,
      role: "admin",
    },
  });

  console.log(`Created admin account: ${admin.email} (id: ${admin.id})`);
  console.log(`Default password: ${adminPassword}`);
  console.log("⚠️  Change this password in production!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
