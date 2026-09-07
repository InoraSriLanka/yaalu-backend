import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring all User model columns exist in PostgreSQL database...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contact_number" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nic_number" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);

    // Sync old columns to new columns
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phoneNumber') THEN
          UPDATE "users" SET "contact_number" = "phoneNumber" WHERE "contact_number" IS NULL AND "phoneNumber" IS NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='nicNumber') THEN
          UPDATE "users" SET "nic_number" = "nicNumber" WHERE "nic_number" IS NULL AND "nicNumber" IS NOT NULL;
        END IF;
      END $$;
    `);

    console.log('✅ All User columns successfully synced and created!');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
