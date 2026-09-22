import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "shop_profiles" DROP COLUMN IF EXISTS "workingDays";`);
  const cols: any = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'shop_profiles';
  `);
  console.log('Final shop_profiles columns:', cols.map((c: any) => c.column_name));
  await prisma.$disconnect();
}

main();
