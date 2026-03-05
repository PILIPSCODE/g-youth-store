import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Seed default admin user
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

    // Seed default categories
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
