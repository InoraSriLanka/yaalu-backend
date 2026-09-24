import { PrismaClient, Role, RiderStatus, OrderStatus, InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seed for Yaalu App...');

  const hashedPassword = await bcrypt.hash('Admin@yaalu123', 10);
  const defaultPassword = await bcrypt.hash('123456', 10);

  // 1. Seed Admin User
  const adminEmail = 'admin@yaalu.lk';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, password: hashedPassword, fullName: 'System Administrator' },
    create: {
      email: adminEmail,
      fullName: 'System Administrator',
      role: Role.ADMIN,
      password: hashedPassword,
    },
  });
  console.log(`✅ Seeded Admin User: ${adminUser.email}`);

  // 2. Seed Customer Users & Profiles
  const customersData = [
    {
      email: 'customer1@yaalu.lk',
      fullName: 'Kavindu Perera',
      phone: '+94771234567',
      city: 'Colombo 03',
      address: 'No. 45, Galle Road, Colombo 03',
    },
    {
      email: 'customer2@yaalu.lk',
      fullName: 'Nimali Silva',
      phone: '+94719876543',
      city: 'Kandy',
      address: 'No. 12, Peradeniya Road, Kandy',
    },
    {
      email: 'customer3@yaalu.lk',
      fullName: 'Kasun Fernando',
      phone: '+94755554433',
      city: 'Negombo',
      address: 'No. 88, Main Street, Negombo',
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: { fullName: c.fullName },
      create: {
        email: c.email,
        fullName: c.fullName,
        role: Role.CUSTOMER,
        password: defaultPassword,
      },
    });

    const prof = await prisma.customerProfile.upsert({
      where: { userId: u.id },
      update: { fullName: c.fullName, phoneNumber: c.phone, city: c.city, deliveryAddress: c.address },
      create: {
        userId: u.id,
        fullName: c.fullName,
        phoneNumber: c.phone,
        city: c.city,
        deliveryAddress: c.address,
      },
    });
    createdCustomers.push({ user: u, profile: prof });
  }
  console.log(`✅ Seeded ${createdCustomers.length} Customers`);

  // 3. Seed Merchant Users & Profiles
  const merchantsData = [
    {
      email: 'supermarket@yaalu.lk',
      ownerName: 'Sunil Weerasinghe',
      shopName: 'Yaalu Fresh Supermarket',
      businessType: 'GROCERY',
      city: 'Colombo',
      address: 'No. 100, Duplication Road, Colombo 04',
      phone: '+94112345678',
    },
    {
      email: 'bakery@yaalu.lk',
      ownerName: 'Mahesh Fonseka',
      shopName: 'Colombo Bake House',
      businessType: 'BAKERY',
      city: 'Colombo',
      address: 'No. 24, Union Place, Colombo 02',
      phone: '+94118765432',
    },
    {
      email: 'greengrocer@yaalu.lk',
      ownerName: 'Chathura Ranasinghe',
      shopName: 'Green Grocers City',
      businessType: 'VEGETABLES',
      city: 'Dehiwala',
      address: 'No. 15, Hill Street, Dehiwala',
      phone: '+94114443322',
    },
  ];

  const createdMerchants: any[] = [];
  for (const m of merchantsData) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { fullName: m.ownerName },
      create: {
        email: m.email,
        fullName: m.ownerName,
        role: Role.SHOP,
        password: defaultPassword,
      },
    });

    const prof = await prisma.shopProfile.upsert({
      where: { userId: u.id },
      update: {
        shopName: m.shopName,
        ownerName: m.ownerName,
        ownerEmail: m.email,
        ownerPhone: m.phone,
        businessType: m.businessType,
        shopAddress: m.address,
      },
      create: {
        userId: u.id,
        shopName: m.shopName,
        ownerName: m.ownerName,
        ownerEmail: m.email,
        ownerPhone: m.phone,
        businessType: m.businessType,
        shopAddress: m.address,
      },
    });
    createdMerchants.push({ user: u, profile: prof });
  }
  console.log(`✅ Seeded ${createdMerchants.length} Merchants`);

  // 4. Seed Rider Users & Profiles
  const ridersData = [
    {
      email: 'rider.sunil@yaalu.lk',
      fullName: 'Sunil Perera',
      phone: '+94771112233',
      vehicleType: 'THREE_WHEEL',
      vehicleNumber: 'WP AA-1234',
      vehicleModel: 'Bajaj RE 2022',
      licenseNumber: 'B1234567',
      status: RiderStatus.AVAILABLE,
      isApproved: true,
      deliveriesCompleted: 142,
      rating: 4.9,
    },
    {
      email: 'rider.kamal@yaalu.lk',
      fullName: 'Kamal Jayasinghe',
      phone: '+94774445566',
      vehicleType: 'MOTORBIKE',
      vehicleNumber: 'WP BCD-5678',
      vehicleModel: 'Yamaha FZ 150',
      licenseNumber: 'B7654321',
      status: RiderStatus.AVAILABLE,
      isApproved: true,
      deliveriesCompleted: 89,
      rating: 4.8,
    },
    {
      email: 'rider.ruwan@yaalu.lk',
      fullName: 'Ruwan Silva',
      phone: '+94718889900',
      vehicleType: 'CAR',
      vehicleNumber: 'WP CAB-9012',
      vehicleModel: 'Toyota Vitz 2018',
      licenseNumber: 'B9988776',
      status: RiderStatus.PENDING,
      isApproved: false,
      deliveriesCompleted: 0,
      rating: 5.0,
    },
  ];

  const createdRiders: any[] = [];
  for (const r of ridersData) {
    const u = await prisma.user.upsert({
      where: { email: r.email },
      update: { fullName: r.fullName },
      create: {
        email: r.email,
        fullName: r.fullName,
        role: Role.RIDER,
        password: defaultPassword,
      },
    });

    const prof = await prisma.riderProfile.upsert({
      where: { userId: u.id },
      update: {
        fullName: r.fullName,
        phoneNumber: r.phone,
        vehicleType: r.vehicleType,
        vehicleNumber: r.vehicleNumber,
        vehicleModel: r.vehicleModel,
        licenseNumber: r.licenseNumber,
        status: r.status,
        isApproved: r.isApproved,
        deliveriesCompleted: r.deliveriesCompleted,
        rating: r.rating,
      },
      create: {
        userId: u.id,
        fullName: r.fullName,
        phoneNumber: r.phone,
        vehicleType: r.vehicleType,
        vehicleNumber: r.vehicleNumber,
        vehicleModel: r.vehicleModel,
        licenseNumber: r.licenseNumber,
        status: r.status,
        isApproved: r.isApproved,
        deliveriesCompleted: r.deliveriesCompleted,
        rating: r.rating,
      },
    });
    createdRiders.push({ user: u, profile: prof });
  }
  console.log(`✅ Seeded ${createdRiders.length} Riders`);

  // 5. Seed Products
  const productsData = [
    {
      name: 'Fresh Organic Milk 1L',
      category: 'Dairy',
      price: 450.0,
      unit: 'bottle',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
      description: 'Pure fresh pasteurized cow milk 1 litre bottle',
      merchantId: createdMerchants[0]?.profile.id || 'default',
      merchantName: 'Yaalu Fresh Supermarket',
    },
    {
      name: 'Keeri Samba Rice 5kg',
      category: 'Grains',
      price: 1650.0,
      unit: 'pack',
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      description: 'Premium quality Sri Lankan Keeri Samba rice 5kg',
      merchantId: createdMerchants[0]?.profile.id || 'default',
      merchantName: 'Yaalu Fresh Supermarket',
    },
    {
      name: 'Freshly Baked White Bread 450g',
      category: 'Bakery',
      price: 190.0,
      unit: 'loaf',
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      description: 'Oven fresh soft white bread loaf',
      merchantId: createdMerchants[1]?.profile.id || 'default',
      merchantName: 'Colombo Bake House',
    },
    {
      name: 'Chocolate Chip Cookies 250g',
      category: 'Bakery',
      price: 650.0,
      unit: 'box',
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
      description: 'Homemade rich chocolate chip butter cookies',
      merchantId: createdMerchants[1]?.profile.id || 'default',
      merchantName: 'Colombo Bake House',
    },
    {
      name: 'Red Apples 1kg',
      category: 'Fruits',
      price: 980.0,
      unit: 'kg',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
      description: 'Crisp and juicy imported red apples',
      merchantId: createdMerchants[2]?.profile.id || 'default',
      merchantName: 'Green Grocers City',
    },
    {
      name: 'Ceylon Premium Tea 250g',
      category: 'Beverages',
      price: 520.0,
      unit: 'pack',
      stock: 90,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',
      description: 'Pure Ceylon BOPF black tea pouch',
      merchantId: createdMerchants[0]?.profile.id || 'default',
      merchantName: 'Yaalu Fresh Supermarket',
    },
  ];

  await prisma.product.deleteMany({});
  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log(`✅ Seeded ${productsData.length} Products`);

  // 6. Seed Orders & Invoices
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.invoice.deleteMany({});

  const sampleOrders = [
    {
      customerName: 'Kavindu Perera',
      totalAmount: 2100.0,
      status: OrderStatus.delivered,
      notes: 'Please leave at front door',
      items: [
        { productName: 'Keeri Samba Rice 5kg', quantity: 1, unitPrice: 1650.0, subtotal: 1650.0 },
        { productName: 'Fresh Organic Milk 1L', quantity: 1, unitPrice: 450.0, subtotal: 450.0 },
      ],
    },
    {
      customerName: 'Nimali Silva',
      totalAmount: 840.0,
      status: OrderStatus.processing,
      notes: 'Call before arriving',
      items: [
        { productName: 'Freshly Baked White Bread 450g', quantity: 1, unitPrice: 190.0, subtotal: 190.0 },
        { productName: 'Chocolate Chip Cookies 250g', quantity: 1, unitPrice: 650.0, subtotal: 650.0 },
      ],
    },
    {
      customerName: 'Kasun Fernando',
      totalAmount: 1500.0,
      status: OrderStatus.confirmed,
      notes: 'Express delivery needed',
      items: [
        { productName: 'Red Apples 1kg', quantity: 1, unitPrice: 980.0, subtotal: 980.0 },
        { productName: 'Ceylon Premium Tea 250g', quantity: 1, unitPrice: 520.0, subtotal: 520.0 },
      ],
    },
  ];

  for (const ord of sampleOrders) {
    const createdOrd = await prisma.order.create({
      data: {
        customerName: ord.customerName,
        totalAmount: ord.totalAmount,
        status: ord.status,
        notes: ord.notes,
        items: {
          create: ord.items,
        },
      },
    });

    await prisma.invoice.create({
      data: {
        customerName: ord.customerName,
        orderId: createdOrd.id,
        amount: ord.totalAmount,
        status: ord.status === OrderStatus.delivered ? InvoiceStatus.paid : InvoiceStatus.pending,
        paidAt: ord.status === OrderStatus.delivered ? new Date() : null,
      },
    });
  }
  console.log(`✅ Seeded ${sampleOrders.length} Orders & Invoices`);

  // 7. Seed Fare Settings
  const farePresets = [
    {
      id: 'THREE_WHEEL',
      vehicleType: 'THREE_WHEEL',
      vehicleName: 'Three-Wheeler / Tuk Tuk',
      petrolPrice: 370.0,
      twoTOilRatio: 0.02,
      twoTOilPrice: 1500.0,
      mileageKmPerLitre: 25.0,
      otherRunningCostPerKm: 5.0,
      fixedCostPerKm: 3.0,
      profitMultiplier: 3.0,
      baseChargeFirstKm: 150.0,
      minimumFare: 150.0,
      commissionPercent: 10.0,
      bidTimeoutMinutes: 2.0,
      isActive: true,
    },
    {
      id: 'MOTORBIKE',
      vehicleType: 'MOTORBIKE',
      vehicleName: 'Motorbike / Bike Delivery',
      petrolPrice: 370.0,
      twoTOilRatio: 0.0,
      twoTOilPrice: 1500.0,
      mileageKmPerLitre: 45.0,
      otherRunningCostPerKm: 3.0,
      fixedCostPerKm: 2.0,
      profitMultiplier: 3.0,
      baseChargeFirstKm: 100.0,
      minimumFare: 100.0,
      commissionPercent: 10.0,
      bidTimeoutMinutes: 2.0,
      isActive: true,
    },
    {
      id: 'CAR',
      vehicleType: 'CAR',
      vehicleName: 'Car / Flex Taxi',
      petrolPrice: 370.0,
      twoTOilRatio: 0.0,
      twoTOilPrice: 0.0,
      mileageKmPerLitre: 14.0,
      otherRunningCostPerKm: 10.0,
      fixedCostPerKm: 6.0,
      profitMultiplier: 3.0,
      baseChargeFirstKm: 250.0,
      minimumFare: 250.0,
      commissionPercent: 12.0,
      bidTimeoutMinutes: 3.0,
      isActive: true,
    },
    {
      id: 'VAN',
      vehicleType: 'VAN',
      vehicleName: 'Van / Large Delivery',
      petrolPrice: 370.0,
      twoTOilRatio: 0.0,
      twoTOilPrice: 0.0,
      mileageKmPerLitre: 10.0,
      otherRunningCostPerKm: 15.0,
      fixedCostPerKm: 8.0,
      profitMultiplier: 3.0,
      baseChargeFirstKm: 350.0,
      minimumFare: 350.0,
      commissionPercent: 15.0,
      bidTimeoutMinutes: 4.0,
      isActive: true,
    },
  ];

  for (const fare of farePresets) {
    await prisma.fareSetting.upsert({
      where: { vehicleType: fare.vehicleType },
      update: fare,
      create: fare,
    });
  }
  console.log(`✅ Seeded ${farePresets.length} Fare Settings`);

  console.log('🎉 Comprehensive Database Seed Completed Successfully!');
}

seedDatabase()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
