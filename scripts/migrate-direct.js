const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/yaalu_db?schema=public"
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL!');

    await client.query(`
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
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);

    // Create fare_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "fare_settings" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "vehicle_type" TEXT UNIQUE NOT NULL DEFAULT 'THREE_WHEEL',
        "vehicle_name" TEXT NOT NULL DEFAULT 'Three-Wheeler / Tuk Tuk',
        "petrol_price" DOUBLE PRECISION NOT NULL DEFAULT 370.0,
        "two_t_oil_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
        "two_t_oil_price" DOUBLE PRECISION NOT NULL DEFAULT 1500.0,
        "mileage_km_per_litre" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
        "other_running_cost_per_km" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        "fixed_cost_per_km" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
        "profit_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
        "base_charge_first_km" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
        "minimum_fare" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
        "commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
        "bid_timeout_minutes" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE "fare_settings"
        ADD COLUMN IF NOT EXISTS "commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
        ADD COLUMN IF NOT EXISTS "bid_timeout_minutes" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
    `);

    // Seed default presets for THREE_WHEEL, MOTORBIKE, CAR, VAN
    await client.query(`
      INSERT INTO "fare_settings" (
        "id", "vehicle_type", "vehicle_name", "petrol_price", "two_t_oil_ratio", "two_t_oil_price",
        "mileage_km_per_litre", "other_running_cost_per_km", "fixed_cost_per_km", "profit_multiplier",
        "base_charge_first_km", "minimum_fare", "is_active"
      ) VALUES 
      ('THREE_WHEEL', 'THREE_WHEEL', 'Three-Wheeler / Tuk Tuk', 370.0, 0.02, 1500.0, 25.0, 5.0, 3.0, 3.0, 150.0, 150.0, true),
      ('MOTORBIKE', 'MOTORBIKE', 'Motorbike / Bike Delivery', 370.0, 0.0, 1500.0, 45.0, 3.0, 2.0, 3.0, 100.0, 100.0, true),
      ('CAR', 'CAR', 'Car / Flex Taxi', 370.0, 0.0, 0.0, 14.0, 10.0, 6.0, 3.0, 250.0, 250.0, true),
      ('VAN', 'VAN', 'Van / Large Delivery', 370.0, 0.0, 0.0, 10.0, 15.0, 8.0, 3.0, 350.0, 350.0, true)
      ON CONFLICT ("vehicle_type") DO NOTHING;
    `);

    console.log('✅ rider_profiles and fare_settings tables migrated and seeded successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

run();
