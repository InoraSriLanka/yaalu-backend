import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Dropping fullName column from users table...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" DROP COLUMN IF EXISTS "fullName";`);
    console.log('Successfully dropped fullName column from users table!');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
