const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findMany();
  console.log(JSON.stringify(p, null, 2));
}

main().finally(() => prisma.$disconnect());
