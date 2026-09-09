import { prisma } from "./config/prisma.js";

async function main() {
  console.log("Clearing database...");

  await prisma.address.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pendingPayment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleared successfully.");
}

main()
  .catch((error) => {
    console.error("Error clearing database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
