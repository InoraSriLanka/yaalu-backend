import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inspecting columns on table "users"...');
  try {
    const columns: any = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Current columns on users table:', columns);

    console.log('Adding missing columns to users table...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contact_number" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nic_number" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP(3);`);
    
    // Check if Role column type matches
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'SHOP', 'RIDER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Cast or set role column
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'text'
        ) THEN
          ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
          ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
          ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::"Role";
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'CUSTOMER'::"Role";
        END IF;
      END $$;
    `);

    const updatedColumns: any = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Updated columns on users table:', updatedColumns);
    console.log('✅ Columns verified and added successfully!');
  } catch (err) {
    console.error('Error during column check/alter:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
