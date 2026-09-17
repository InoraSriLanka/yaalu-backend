import { Client } from 'pg';

async function seed() {
  console.log('🌱 Starting Database Initialization...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yaalu_db',
  });

  try {
    await client.connect();
    console.log('✅ Connected to Database for Seeding.');
    await client.end();
  } catch (err: any) {
    console.warn('⚠️ Seeding note:', err.message);
  }
}

seed();
