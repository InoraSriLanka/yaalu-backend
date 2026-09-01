import { DataSource } from 'typeorm';

async function seed() {
  console.log('🌱 Starting Database Initialization for Yaalu Microservices...');

  const productDS = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'yaalu_product',
  });

  try {
    await productDS.initialize();
    await productDS.query(`
      INSERT INTO products (id, name, description, price, category, stock, "storeId", "createdAt", "updatedAt")
      VALUES 
        ('11111111-1111-1111-1111-111111111111', 'Red Apple 1kg', 'Freshly picked crisp red apples', 650.00, 'Fruits', 100, 'Green Mart', NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'Banana 500g', 'Local sweet Cavendish bananas', 280.00, 'Fruits', 150, 'Green Mart', NOW(), NOW()),
        ('33333333-3333-3333-3333-333333333333', 'Broccoli 250g', 'Imported quality farm fresh broccoli', 420.00, 'Vegetables', 80, 'Fresh Basket', NOW(), NOW()),
        ('44444444-4444-4444-4444-444444444444', 'Fresh Milk 1L', 'Pure Highland pasteurized milk', 550.00, 'Dairy', 120, 'Daily Picks', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Product DB seeded successfully.');
    await productDS.destroy();
  } catch (err) {
    console.warn('⚠️ Product DB seeding note:', err.message);
  }

  console.log('🎉 Database Initialization Complete!');
}

seed();
