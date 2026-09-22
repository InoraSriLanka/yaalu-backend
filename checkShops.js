const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const shops = await prisma.user.findMany({
      where: { role: 'SHOP' },
      include: { shopProfile: true }
    });
    console.log(JSON.stringify(shops, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
