import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Aligning all profile table column names with Prisma schema...');
  try {
    // Add working_days to shop_profiles
    await prisma.$executeRawUnsafe(`ALTER TABLE "shop_profiles" ADD COLUMN IF NOT EXISTS "working_days" TEXT;`);

    // Ensure all columns in shop_profiles
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "shop_profiles"
        ADD COLUMN IF NOT EXISTS "shop_name" TEXT,
        ADD COLUMN IF NOT EXISTS "shop_address" TEXT,
        ADD COLUMN IF NOT EXISTS "outlet_address" TEXT,
        ADD COLUMN IF NOT EXISTS "city" TEXT,
        ADD COLUMN IF NOT EXISTS "region" TEXT,
        ADD COLUMN IF NOT EXISTS "merchant_type" TEXT,
        ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "business_type" TEXT,
        ADD COLUMN IF NOT EXISTS "is_business_registered" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "business_name" TEXT,
        ADD COLUMN IF NOT EXISTS "registration_no" TEXT,
        ADD COLUMN IF NOT EXISTS "is_tax_registered" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "tin_number" TEXT,
        ADD COLUMN IF NOT EXISTS "is_vat_registered" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "vat_number" TEXT,
        ADD COLUMN IF NOT EXISTS "business_address" TEXT,
        ADD COLUMN IF NOT EXISTS "business_email" TEXT,
        ADD COLUMN IF NOT EXISTS "owner_name" TEXT,
        ADD COLUMN IF NOT EXISTS "owner_email" TEXT,
        ADD COLUMN IF NOT EXISTS "owner_phone" TEXT,
        ADD COLUMN IF NOT EXISTS "manager_name" TEXT,
        ADD COLUMN IF NOT EXISTS "manager_phone" TEXT,
        ADD COLUMN IF NOT EXISTS "manager_email" TEXT,
        ADD COLUMN IF NOT EXISTS "open_time" TEXT,
        ADD COLUMN IF NOT EXISTS "close_time" TEXT,
        ADD COLUMN IF NOT EXISTS "working_days" TEXT,
        ADD COLUMN IF NOT EXISTS "bank_name" TEXT,
        ADD COLUMN IF NOT EXISTS "account_name" TEXT,
        ADD COLUMN IF NOT EXISTS "account_no" TEXT,
        ADD COLUMN IF NOT EXISTS "branch" TEXT,
        ADD COLUMN IF NOT EXISTS "logo_url" TEXT,
        ADD COLUMN IF NOT EXISTS "banner_url" TEXT,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "is_submitted" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure customer_profiles columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "customer_profiles"
        ADD COLUMN IF NOT EXISTS "delivery_address" TEXT,
        ADD COLUMN IF NOT EXISTS "city" TEXT,
        ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure rider_profiles columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "rider_profiles"
        ADD COLUMN IF NOT EXISTS "full_name" TEXT,
        ADD COLUMN IF NOT EXISTS "phone_number" TEXT,
        ADD COLUMN IF NOT EXISTS "nic_number" TEXT,
        ADD COLUMN IF NOT EXISTS "profile_photo_url" TEXT,
        ADD COLUMN IF NOT EXISTS "address" TEXT,
        ADD COLUMN IF NOT EXISTS "city" TEXT,
        ADD COLUMN IF NOT EXISTS "vehicle_type" TEXT DEFAULT 'MOTORBIKE',
        ADD COLUMN IF NOT EXISTS "vehicle_number" TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS "vehicle_model" TEXT,
        ADD COLUMN IF NOT EXISTS "license_number" TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS "license_expiry" TEXT,
        ADD COLUMN IF NOT EXISTS "license_front_url" TEXT,
        ADD COLUMN IF NOT EXISTS "license_back_url" TEXT,
        ADD COLUMN IF NOT EXISTS "bank_name" TEXT,
        ADD COLUMN IF NOT EXISTS "account_name" TEXT,
        ADD COLUMN IF NOT EXISTS "account_no" TEXT,
        ADD COLUMN IF NOT EXISTS "account_branch" TEXT,
        ADD COLUMN IF NOT EXISTS "status" "RiderStatus" DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS "current_latitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "current_longitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "is_approved" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "deliveries_completed" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION DEFAULT 5.0,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log('✅ All profile table columns aligned perfectly!');
  } catch (err) {
    console.error('Error aligning profile columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
