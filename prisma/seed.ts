import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Yaalu database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ─── 1. SHOP USERS ───────────────────────────────────────
  console.log('Creating shop accounts...');

  const shop1User = await prisma.user.upsert({
    where: { email: 'kamal@yaalu.lk' },
    update: {},
    create: {
      email: 'kamal@yaalu.lk',
      role: 'SHOP',
      password: passwordHash,
      shopProfile: {
        create: {
          shopName: 'Kamal Fresh Groceries',
          ownerName: 'Kamal Perera',
          ownerEmail: 'kamal@yaalu.lk',
          ownerPhone: '0771234567',
          businessType: 'Grocery',
          shopAddress: 'No. 45, Kandy Road, Peradeniya',
          outletAddress: 'No. 45, Kandy Road, Peradeniya, Sri Lanka',
          registrationNo: 'BRN/2023/001234',
          bankName: 'Bank of Ceylon',
          accountName: 'Kamal Perera',
          accountNo: '001234567890',
          accountBranch: 'Peradeniya',
          cardLast4: '4242',
          cardType: 'VISA',
        },
      },
    },
  });

  const shop2User = await prisma.user.upsert({
    where: { email: 'nimal@yaalu.lk' },
    update: {},
    create: {
      email: 'nimal@yaalu.lk',
      role: 'SHOP',
      password: passwordHash,
      shopProfile: {
        create: {
          shopName: "Nimal's Electronics Hub",
          ownerName: 'Nimal Silva',
          ownerEmail: 'nimal@yaalu.lk',
          ownerPhone: '0779876543',
          businessType: 'Electronics',
          shopAddress: 'No. 12, Main Street, Colombo 03',
          outletAddress: 'No. 12, Main Street, Colombo 03, Sri Lanka',
          registrationNo: 'BRN/2022/005678',
          bankName: 'Peoples Bank',
          accountName: 'Nimal Silva',
          accountNo: '009876543210',
          accountBranch: 'Colombo Fort',
          cardLast4: '1234',
          cardType: 'MASTERCARD',
        },
      },
    },
  });

  const shop3User = await prisma.user.upsert({
    where: { email: 'ayasha@yaalu.lk' },
    update: {},
    create: {
      email: 'ayasha@yaalu.lk',
      role: 'SHOP',
      password: passwordHash,
      shopProfile: {
        create: {
          shopName: 'Ayasha Fashion Store',
          ownerName: 'Ayasha Fernando',
          ownerEmail: 'ayasha@yaalu.lk',
          ownerPhone: '0761122334',
          businessType: 'Fashion & Clothing',
          shopAddress: 'No. 78, Galle Road, Kalutara',
          outletAddress: 'No. 78, Galle Road, Kalutara, Sri Lanka',
          registrationNo: 'BRN/2024/009012',
          bankName: 'Commercial Bank',
          accountName: 'Ayasha Fernando',
          accountNo: '112233445566',
          accountBranch: 'Kalutara',
        },
      },
    },
  });

  // ─── 2. RIDER USERS ──────────────────────────────────────
  console.log('Creating rider accounts...');

  await prisma.user.upsert({
    where: { email: 'sunil.rider@yaalu.lk' },
    update: {},
    create: {
      email: 'sunil.rider@yaalu.lk',
      role: 'RIDER',
      password: passwordHash,
      riderProfile: {
        create: {
          vehicleType: 'MOTORBIKE',
          vehicleNumber: 'WP CAB 1234',
          vehicleModel: 'Honda CB150R',
          licenseNumber: 'B1234567',
          status: 'AVAILABLE',
          isApproved: true,
          currentLatitude: 6.9271,
          currentLongitude: 79.8612,
          bankName: 'Sampath Bank',
          accountName: 'Sunil Rathnayake',
          accountNo: '0045678901',
          accountBranch: 'Nugegoda',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'gamini.rider@yaalu.lk' },
    update: {},
    create: {
      email: 'gamini.rider@yaalu.lk',
      role: 'RIDER',
      password: passwordHash,
      riderProfile: {
        create: {
          vehicleType: 'THREE_WHEEL',
          vehicleNumber: 'CP TUK 5678',
          vehicleModel: 'Bajaj RE',
          licenseNumber: 'B9876543',
          status: 'BUSY',
          isApproved: true,
          currentLatitude: 7.2906,
          currentLongitude: 80.6337,
          bankName: 'NSB',
          accountName: 'Gamini Jayasuriya',
          accountNo: '0077889900',
          accountBranch: 'Kandy',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'priya.rider@yaalu.lk' },
    update: {},
    create: {
      email: 'priya.rider@yaalu.lk',
      role: 'RIDER',
      password: passwordHash,
      riderProfile: {
        create: {
          vehicleType: 'SCOOTER',
          vehicleNumber: 'SG SCT 9012',
          vehicleModel: 'Honda Dio',
          licenseNumber: 'B5554433',
          status: 'PENDING',
          isApproved: false,
          bankName: 'HNB',
          accountName: 'Priya Kumari',
          accountNo: '0034567812',
          accountBranch: 'Galle',
        },
      },
    },
  });

  // ─── 3. CUSTOMER USERS & PROFILES ──────────────────────
  console.log('Creating customer accounts & profiles...');

  const customer1User = await prisma.user.upsert({
    where: { email: 'saman@gmail.com' },
    update: {},
    create: {
      email: 'saman@gmail.com',
      role: 'CUSTOMER',
      password: passwordHash,
      customerProfile: {
        create: {
          fullName: 'Saman Kumara',
          phone: '0771234567',
          deliveryAddress: 'No. 23, Temple Road, Nugegoda',
          city: 'Nugegoda',
          latitude: 6.8689,
          longitude: 79.8879,
          cardLast4: '5566',
          cardType: 'VISA',
          billingAddress: 'No. 23, Temple Road, Nugegoda, Sri Lanka',
          notes: 'VIP customer, preferred morning deliveries',
        },
      },
    },
    include: { customerProfile: true },
  });

  const customer2User = await prisma.user.upsert({
    where: { email: 'dilini@gmail.com' },
    update: {},
    create: {
      email: 'dilini@gmail.com',
      role: 'CUSTOMER',
      password: passwordHash,
      customerProfile: {
        create: {
          fullName: 'Dilini Perera',
          phone: '0789876543',
          deliveryAddress: 'No. 8, Lake View, Kandy',
          city: 'Kandy',
          latitude: 7.2906,
          longitude: 80.6337,
          cardLast4: '7788',
          cardType: 'MASTERCARD',
          billingAddress: 'No. 8, Lake View, Kandy, Sri Lanka',
          notes: 'Call before delivery',
        },
      },
    },
    include: { customerProfile: true },
  });

  const customer3User = await prisma.user.upsert({
    where: { email: 'roshan@gmail.com' },
    update: {},
    create: {
      email: 'roshan@gmail.com',
      role: 'CUSTOMER',
      password: passwordHash,
      customerProfile: {
        create: {
          fullName: 'Roshan Bandara',
          phone: '0765544332',
          deliveryAddress: 'No. 55, Beach Road, Galle',
          city: 'Galle',
          latitude: 6.0535,
          longitude: 80.2210,
          cardLast4: '9900',
          cardType: 'VISA',
          billingAddress: 'No. 55, Beach Road, Galle, Sri Lanka',
        },
      },
    },
    include: { customerProfile: true },
  });

  const customer4User = await prisma.user.upsert({
    where: { email: 'amali@gmail.com' },
    update: {},
    create: {
      email: 'amali@gmail.com',
      role: 'CUSTOMER',
      password: passwordHash,
      customerProfile: {
        create: {
          fullName: 'Amali Jayawardena',
          phone: '0701122334',
          deliveryAddress: 'No. 10, Hill Street, Nuwara Eliya',
          city: 'Nuwara Eliya',
          latitude: 6.9497,
          longitude: 80.7891,
          cardLast4: '1122',
          cardType: 'MASTERCARD',
          billingAddress: 'No. 10, Hill Street, Nuwara Eliya, Sri Lanka',
        },
      },
    },
    include: { customerProfile: true },
  });

  const customer5User = await prisma.user.upsert({
    where: { email: 'kasun@gmail.com' },
    update: {},
    create: {
      email: 'kasun@gmail.com',
      role: 'CUSTOMER',
      password: passwordHash,
      customerProfile: {
        create: {
          fullName: 'Kasun Fernando',
          phone: '0755443322',
          deliveryAddress: 'No. 77, Flower Road, Colombo 07',
          city: 'Colombo',
          latitude: 6.9034,
          longitude: 79.8607,
          cardLast4: '3344',
          cardType: 'VISA',
          billingAddress: 'No. 77, Flower Road, Colombo 07, Sri Lanka',
        },
      },
    },
    include: { customerProfile: true },
  });

  const customer6User = await prisma.user.upsert({
    where: { email: 'kasun.sagara@gmail.com' },
    update: {
      customerProfile: {
        update: {
          fullName: 'Kasun Sagara',
          phone: '0112121145',
          deliveryAddress: 'No. 12, Highlevel Road, Kottawa',
          city: 'Kottawa',
        },
      },
    },
    create: {
      email: 'kasun.sagara@gmail.com',
      role: 'CUSTOMER',
      password: passwordHash,
      customerProfile: {
        create: {
          fullName: 'Kasun Sagara',
          phone: '0112121145',
          deliveryAddress: 'No. 12, Highlevel Road, Kottawa',
          city: 'Kottawa',
          latitude: 6.8433,
          longitude: 79.9657,
          cardLast4: '8899',
          cardType: 'VISA',
          billingAddress: 'No. 12, Highlevel Road, Kottawa, Sri Lanka',
          notes: 'Regular customer from Kottawa',
        },
      },
    },
    include: { customerProfile: true },
  });

  // Fetch customer profile IDs
  const cp1 = (await prisma.customerProfile.findUnique({ where: { userId: customer1User.id } }))!;
  const cp2 = (await prisma.customerProfile.findUnique({ where: { userId: customer2User.id } }))!;
  const cp3 = (await prisma.customerProfile.findUnique({ where: { userId: customer3User.id } }))!;
  const cp4 = (await prisma.customerProfile.findUnique({ where: { userId: customer4User.id } }))!;
  const cp5 = (await prisma.customerProfile.findUnique({ where: { userId: customer5User.id } }))!;
  const cp6 = (await prisma.customerProfile.findUnique({ where: { userId: customer6User.id } }))!;

  // ─── 4. PRODUCTS ─────────────────────────────────────────
  console.log('Creating products...');

  const shopProfile1 = await prisma.shopProfile.findUnique({ where: { userId: shop1User.id } });
  const shopProfile2 = await prisma.shopProfile.findUnique({ where: { userId: shop2User.id } });
  const shopProfile3 = await prisma.shopProfile.findUnique({ where: { userId: shop3User.id } });

  const products = await Promise.all([
    prisma.product.create({ data: { merchantId: shopProfile1!.id, name: 'Fresh Tomatoes', price: 120, unit: 'kg', stock: 50, description: 'Locally grown fresh tomatoes', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile1!.id, name: 'Basmati Rice (5kg)', price: 1850, unit: 'bag', stock: 30, description: 'Premium quality basmati rice', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile1!.id, name: 'Coconut Oil (500ml)', price: 650, unit: 'bottle', stock: 20, description: 'Pure cold-pressed coconut oil', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile1!.id, name: 'Green Chilli', price: 80, unit: 'kg', stock: 15, description: 'Farm fresh green chilli', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile2!.id, name: 'USB-C Cable 2m', price: 950, unit: 'piece', stock: 100, description: 'Fast charging USB-C cable', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile2!.id, name: 'Wireless Earbuds', price: 4500, unit: 'piece', stock: 25, description: 'Bluetooth 5.0 wireless earbuds', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile2!.id, name: 'Power Bank 10000mAh', price: 3200, unit: 'piece', stock: 40, description: 'Fast charge power bank', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile3!.id, name: 'Cotton T-Shirt (M)', price: 1200, unit: 'piece', stock: 60, description: '100% cotton round-neck t-shirt', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile3!.id, name: 'Slim Fit Jeans', price: 3500, unit: 'piece', stock: 35, description: 'Modern slim-fit denim jeans', isActive: true } }),
    prisma.product.create({ data: { merchantId: shopProfile3!.id, name: 'Ladies Kurti', price: 2200, unit: 'piece', stock: 45, description: 'Elegant printed ladies kurti', isActive: true } }),
  ]);

  // ─── 5. ORDERS ───────────────────────────────────────────
  console.log('Creating orders...');

  const order1 = await prisma.order.create({ data: { merchantId: shopProfile1!.id, customerId: cp1.id, customerName: cp1.fullName || 'Saman Kumara', status: 'delivered', totalAmount: 2090, notes: 'Leave at gate', items: { create: [{ productId: products[0].id, productName: products[0].name, quantity: 2, unitPrice: 120, subtotal: 240 }, { productId: products[1].id, productName: products[1].name, quantity: 1, unitPrice: 1850, subtotal: 1850 }] } } });
  const order2 = await prisma.order.create({ data: { merchantId: shopProfile1!.id, customerId: cp2.id, customerName: cp2.fullName || 'Dilini Perera', status: 'confirmed', totalAmount: 730, items: { create: [{ productId: products[2].id, productName: products[2].name, quantity: 1, unitPrice: 650, subtotal: 650 }, { productId: products[3].id, productName: products[3].name, quantity: 1, unitPrice: 80, subtotal: 80 }] } } });
  const order3 = await prisma.order.create({ data: { merchantId: shopProfile2!.id, customerId: cp3.id, customerName: cp3.fullName || 'Roshan Bandara', status: 'processing', totalAmount: 5450, notes: 'Call before delivery', items: { create: [{ productId: products[4].id, productName: products[4].name, quantity: 1, unitPrice: 950, subtotal: 950 }, { productId: products[5].id, productName: products[5].name, quantity: 1, unitPrice: 4500, subtotal: 4500 }] } } });
  const order4 = await prisma.order.create({ data: { merchantId: shopProfile2!.id, customerId: cp4.id, customerName: cp4.fullName || 'Amali Jayawardena', status: 'pending', totalAmount: 3200, items: { create: [{ productId: products[6].id, productName: products[6].name, quantity: 1, unitPrice: 3200, subtotal: 3200 }] } } });
  const order5 = await prisma.order.create({ data: { merchantId: shopProfile3!.id, customerId: cp5.id, customerName: cp5.fullName || 'Kasun Fernando', status: 'shipped', totalAmount: 6900, items: { create: [{ productId: products[7].id, productName: products[7].name, quantity: 2, unitPrice: 1200, subtotal: 2400 }, { productId: products[8].id, productName: products[8].name, quantity: 1, unitPrice: 3500, subtotal: 3500 }, { productId: products[9].id, productName: products[9].name, quantity: 1, unitPrice: 1000, subtotal: 1000 }] } } });
  const order6 = await prisma.order.create({ data: { merchantId: shopProfile3!.id, customerId: cp5.id, customerName: cp5.fullName || 'Kasun Fernando', status: 'cancelled', totalAmount: 2200, notes: 'Customer cancelled', items: { create: [{ productId: products[9].id, productName: products[9].name, quantity: 1, unitPrice: 2200, subtotal: 2200 }] } } });

  // ─── 6. INVOICES ─────────────────────────────────────────
  console.log('Creating invoices...');

  await prisma.invoice.createMany({
    data: [
      { merchantId: shopProfile1!.id, customerId: cp1.id, customerName: cp1.fullName || 'Saman Kumara', orderId: order1.id, amount: 2090, status: 'paid', paidAt: new Date('2026-09-01'), dueDate: new Date('2026-09-05'), notes: 'Paid via bank transfer' },
      { merchantId: shopProfile1!.id, customerId: cp2.id, customerName: cp2.fullName || 'Dilini Perera', orderId: order2.id, amount: 730,  status: 'pending', dueDate: new Date('2026-09-15') },
      { merchantId: shopProfile2!.id, customerId: cp3.id, customerName: cp3.fullName || 'Roshan Bandara', orderId: order3.id, amount: 5450, status: 'pending', dueDate: new Date('2026-09-12'), notes: 'Online payment pending' },
      { merchantId: shopProfile2!.id, customerId: cp4.id, customerName: cp4.fullName || 'Amali Jayawardena', orderId: order4.id, amount: 3200, status: 'pending', dueDate: new Date('2026-09-20') },
      { merchantId: shopProfile3!.id, customerId: cp5.id, customerName: cp5.fullName || 'Kasun Fernando', orderId: order5.id, amount: 6900, status: 'paid',    paidAt: new Date('2026-09-06'), dueDate: new Date('2026-09-10') },
      { merchantId: shopProfile3!.id, customerId: cp5.id, customerName: cp5.fullName || 'Kasun Fernando', orderId: order6.id, amount: 2200, status: 'pending', dueDate: new Date('2026-09-08'), notes: 'Refund required' },
    ],
  });

  console.log('');
  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📦 Data created:');
  console.log('   🏪 3 Shop accounts  (with bank + card details)');
  console.log('   🛵 3 Rider accounts (with bank details)');
  console.log('   👤 3 Customer users (with card details)');
  console.log('   🛒 10 Products across 3 shops');
  console.log('   👥 5 Order customers');
  console.log('   🧾 6 Orders (various statuses)');
  console.log('   💳 6 Invoices');
  console.log('');
  console.log('🔑 All accounts → Password: Password123!');
  console.log('   SHOP:     kamal@yaalu.lk | nimal@yaalu.lk | ayasha@yaalu.lk');
  console.log('   RIDER:    sunil.rider@yaalu.lk | gamini.rider@yaalu.lk | priya.rider@yaalu.lk');
  console.log('   CUSTOMER: saman@gmail.com | dilini@gmail.com | roshan@gmail.com');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

