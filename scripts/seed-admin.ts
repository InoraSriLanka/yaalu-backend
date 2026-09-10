import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  console.log('🔐 Seeding admin user...');

  const email = 'admin@yaalu.lk';
  const password = 'Admin@yaalu123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Update role to ADMIN if not already
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', password: hashedPassword },
      });
      console.log(`✅ Updated existing user ${email} to ADMIN role`);
    } else {
      console.log(`✅ Admin user ${email} already exists with ADMIN role`);
    }
  } else {
    await prisma.user.create({
      data: {
        email,
        role: 'ADMIN',
        password: hashedPassword,
      },
    });
    console.log(`✅ Created admin user: ${email} / ${password}`);
  }

  await prisma.$disconnect();
}

seedAdmin().catch((e) => {
  console.error('❌ Failed to seed admin:', e);
  process.exit(1);
});
