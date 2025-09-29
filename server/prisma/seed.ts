import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting admin user creation...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@employme.com" },
  });

  if (existingAdmin) {
    console.log("� Admin user already exists: admin@employme.com");
    return;
  }

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@employme.com",
      password: await bcrypt.hash("AdminPassword123!", 12),
      firstName: "Admin",
      lastName: "User",
      isVerified: true,
      isActive: true,
      role: "ADMIN",
      admin: {
        create: {
          firstName: "Admin",
          lastName: "User",
        },
      },
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log("📧 Email: admin@employme.com");
  console.log("🔒 Password: AdminPassword123!");
}

main()
  .then(() => {
    console.log("🎉 Admin setup completed!");
  })
  .catch((e) => {
    console.error("❌ Error creating admin user:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
