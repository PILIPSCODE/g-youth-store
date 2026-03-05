require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
console.log("Connecting with URL:", url ? url.substring(0, 50) + "..." : "NOT SET");

const adapter = new PrismaPg(url);
const prisma = new PrismaClient({ adapter });

prisma.user.count()
  .then(count => {
    console.log("SUCCESS! User count:", count);
    process.exit(0);
  })
  .catch(e => {
    console.error("FULL ERROR:", e);
    process.exit(1);
  });
