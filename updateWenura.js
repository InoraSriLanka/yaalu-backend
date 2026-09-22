const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({
      where: { fullName: { contains: 'Wenura' } },
      include: { riderProfile: true }
    });

    if (user && user.riderProfile) {
      await prisma.riderProfile.update({
        where: { id: user.riderProfile.id },
        data: {
          phone: '+94771234567',
          nicNumber: '951234567V',
          address: '123 Main St',
          city: 'Colombo'
        }
      });
      console.log('Updated Wenura Perera successfully!');
    } else {
      console.log('Wenura Perera not found in the database.');
    }
  } catch (error) {
    console.error('Error updating:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
