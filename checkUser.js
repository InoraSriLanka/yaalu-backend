const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '5d771ffe-5551-4511-9206-88c6800bbc0b';
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shopProfile: true }
  });
  console.log(JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
