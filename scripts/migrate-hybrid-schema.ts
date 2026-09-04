import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating Database to Hybrid User & Profile Architecture...');
  try {
    // 1. Create Role enum if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'SHOP', 'RIDER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create RiderStatus enum if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "RiderStatus" AS ENUM ('PENDING', 'AVAILABLE', 'BUSY', 'OFFLINE', 'SUSPENDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Alter users table to have: id, name, email, contact_number, nic_number, role, password, otp, otp_expires_at, created_at, updated_at
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "name" TEXT,
        ADD COLUMN IF NOT EXISTS "contact_number" TEXT,
        ADD COLUMN IF NOT EXISTS "nic_number" TEXT,
        ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);

    // 4. Create customer_profiles table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "customer_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "delivery_address" TEXT,
        "city" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create shop_profiles table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "shop_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "shop_name" TEXT NOT NULL,
        "shop_address" TEXT,
        "outlet_address" TEXT,
        "city" TEXT,
        "region" TEXT,
        "merchant_type" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "business_type" TEXT,
        "is_business_registered" BOOLEAN NOT NULL DEFAULT false,
        "business_name" TEXT,
        "registration_no" TEXT,
        "is_tax_registered" BOOLEAN NOT NULL DEFAULT false,
        "tin_number" TEXT,
        "is_vat_registered" BOOLEAN NOT NULL DEFAULT false,
        "vat_number" TEXT,
        "business_address" TEXT,
        "business_email" TEXT,
        "owner_name" TEXT,
        "owner_email" TEXT,
        "owner_phone" TEXT,
        "manager_name" TEXT,
        "manager_phone" TEXT,
        "manager_email" TEXT,
        "open_time" TEXT,
        "close_time" TEXT,
        "workingDays" TEXT,
        "bank_name" TEXT,
        "account_name" TEXT,
        "account_no" TEXT,
        "branch" TEXT,
        "logo_url" TEXT,
        "banner_url" TEXT,
        "description" TEXT,
        "is_submitted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create rider_profiles table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "rider_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "vehicle_type" TEXT NOT NULL,
        "vehicle_number" TEXT NOT NULL,
        "vehicle_model" TEXT,
        "license_number" TEXT NOT NULL,
        "status" "RiderStatus" NOT NULL DEFAULT 'PENDING',
        "current_latitude" DOUBLE PRECISION,
        "current_longitude" DOUBLE PRECISION,
        "is_approved" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Successfully created customer_profiles, shop_profiles, and rider_profiles tables!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
