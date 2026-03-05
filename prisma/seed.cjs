const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Use the unpooled URL for direct TCP connection (works in Node.js)
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...");
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@posgereja.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@posgereja.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("Admin user created:", admin.email);
  } else {
    console.log("Admin user already exists:", existingAdmin.email);
  }

  const categories = ["Makanan", "Minuman", "Snack", "Lainnya"];
  for (const name of categories) {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (!existing) {
      await prisma.category.create({ data: { name } });
      console.log("Category created:", name);
    } else {
      console.log("Category already exists:", name);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
