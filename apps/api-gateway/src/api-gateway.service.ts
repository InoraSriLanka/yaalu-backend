import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@app/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedInitialPlatformData();
    } catch (err: any) {
      this.logger.warn(`Initial seed check note: ${err.message}`);
    }
  }

  getHello(): string {
    return 'Yaalu API Gateway is running!';
  }

  async seedInitialPlatformData() {
    const adminEmail = 'admin@yaalu.lk';
    const adminPassword = 'Admin@yaalu123';

    // 1. Ensure Default System Administrator exists
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'System Administrator',
          role: 'ADMIN',
          password: hashedAdminPassword,
        },
      });
      this.logger.log(`Created default Administrator: ${adminEmail}`);
    }

    // 2. Check if we need initial demo records for the dashboard
    const userCount = await this.prisma.user.count();
    if (userCount > 1) {
      return;
    }

    this.logger.log('Seeding initial platform demo data for Admin Dashboard...');

    const defaultPassword = await bcrypt.hash('Yaalu@123456', 10);

    // ─── Seed Merchants / Shops ──────────────────────────────────
    const shop1User = await this.prisma.user.create({
      data: {
        email: 'tasty.foods@yaalu.lk',
        fullName: 'Kamal Gunaratne',
        role: 'SHOP',
        password: defaultPassword,
        shopProfile: {
          create: {
            shopName: 'Tasty Delights Cafe & Restaurant',
            ownerName: 'Kamal Gunaratne',
            ownerPhone: '+94771122334',
            ownerEmail: 'tasty.foods@yaalu.lk',
            businessType: 'Restaurant & Bakery',
            shopAddress: '142 Galle Road, Colombo 03',
            outletAddress: 'Colombo 03 Outlet',
            registrationNo: 'PV-89214',
            shopImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600',
            logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200',
          },
        },
      },
      include: { shopProfile: true },
    });

    const shop2User = await this.prisma.user.create({
      data: {
        email: 'supermart.express@yaalu.lk',
        fullName: 'Sunil Silva',
        role: 'SHOP',
        password: defaultPassword,
        shopProfile: {
          create: {
            shopName: 'SuperMart Express Kiribathgoda',
            ownerName: 'Sunil Silva',
            ownerPhone: '+94772233445',
            ownerEmail: 'supermart.express@yaalu.lk',
            businessType: 'Supermarket & Grocery',
            shopAddress: '58 Kandy Road, Kiribathgoda',
            outletAddress: 'Kiribathgoda Main',
            registrationNo: 'PV-33102',
            shopImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=600',
            logoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=200',
          },
        },
      },
      include: { shopProfile: true },
    });

    const shop3User = await this.prisma.user.create({
      data: {
        email: 'healthfirst.pharmacy@yaalu.lk',
        fullName: 'Dr. Anura Wickramasinghe',
        role: 'SHOP',
        password: defaultPassword,
        shopProfile: {
          create: {
            shopName: 'HealthFirst Pharmacy & Wellness',
            ownerName: 'Dr. Anura Wickramasinghe',
            ownerPhone: '+94773344556',
            ownerEmail: 'healthfirst.pharmacy@yaalu.lk',
            businessType: 'Pharmacy & Healthcare',
            shopAddress: '88 High Level Road, Nugegoda',
            outletAddress: 'Nugegoda Junction',
            registrationNo: 'PV-77192',
            shopImage: 'https://images.unsplash.com/photo-1586015555751-63c29210214a?q=80&w=600',
            logoUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=200',
          },
        },
      },
      include: { shopProfile: true },
    });

    // ─── Seed Riders ─────────────────────────────────────────────
    await this.prisma.user.create({
      data: {
        email: 'kasun.rider@yaalu.lk',
        fullName: 'Kasun Perera',
        role: 'RIDER',
        password: defaultPassword,
        riderProfile: {
          create: {
            vehicleType: 'MOTORBIKE',
            vehicleNumber: 'WP BCD-1234',
            vehicleModel: 'Honda Dio 110 (Red)',
            licenseNumber: 'B1234567',
            status: 'AVAILABLE',
            isApproved: true,
            currentLatitude: 6.9271,
            currentLongitude: 79.8612,
          },
        },
      },
    });

    await this.prisma.user.create({
      data: {
        email: 'nuwan.rider@yaalu.lk',
        fullName: 'Nuwan Silva',
        role: 'RIDER',
        password: defaultPassword,
        riderProfile: {
          create: {
            vehicleType: 'THREE_WHEEL',
            vehicleNumber: 'WP AB-5678',
            vehicleModel: 'Bajaj RE 4S (Green)',
            licenseNumber: 'B2345678',
            status: 'BUSY',
            isApproved: true,
            currentLatitude: 6.9147,
            currentLongitude: 79.8731,
          },
        },
      },
    });

    await this.prisma.user.create({
      data: {
        email: 'chaminda.rider@yaalu.lk',
        fullName: 'Chaminda Fernando',
        role: 'RIDER',
        password: defaultPassword,
        riderProfile: {
          create: {
            vehicleType: 'CAR',
            vehicleNumber: 'WP CAD-9012',
            vehicleModel: 'Toyota Aqua (White)',
            licenseNumber: 'B3456789',
            status: 'PENDING',
            isApproved: false,
          },
        },
      },
    });

    // ─── Seed Customers ──────────────────────────────────────────
    await this.prisma.user.create({
      data: {
        email: 'tharindu.customer@yaalu.lk',
        fullName: 'Tharindu Bandara',
        role: 'CUSTOMER',
        password: defaultPassword,
        customerProfile: {
          create: {
            fullName: 'Tharindu Bandara',
            phoneNumber: '+94771234567',
            deliveryAddress: '24 Flower Road, Colombo 07',
            city: 'Colombo',
            nicNumber: '199512304567',
          },
        },
      },
    });

    await this.prisma.user.create({
      data: {
        email: 'nadeesha.customer@yaalu.lk',
        fullName: 'Nadeesha Jayawardena',
        role: 'CUSTOMER',
        password: defaultPassword,
        customerProfile: {
          create: {
            fullName: 'Nadeesha Jayawardena',
            phoneNumber: '+94761234567',
            deliveryAddress: '15 Havelock Road, Colombo 05',
            city: 'Colombo',
            nicNumber: '199854301234',
          },
        },
      },
    });

    // ─── Seed Products ───────────────────────────────────────────
    const p1 = await this.prisma.product.create({
      data: {
        merchantId: shop1User.shopProfile?.id || 'shop-1',
        merchantName: 'Tasty Delights Cafe & Restaurant',
        name: 'Special Chicken Fried Rice & Chilli Paste',
        sku: 'RICE-001',
        price: 950.0,
        costPrice: 600.0,
        unit: 'portion',
        stock: 45,
        category: 'Food & Meals',
        description: 'Fragrant basmati rice tossed with fresh chicken, spring onions, eggs, and homemade chilli paste.',
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=400',
        isActive: true,
      },
    });

    const p2 = await this.prisma.product.create({
      data: {
        merchantId: shop1User.shopProfile?.id || 'shop-1',
        merchantName: 'Tasty Delights Cafe & Restaurant',
        name: 'Cheese Kottu Roti with Roast Chicken',
        sku: 'KOTTU-002',
        price: 1350.0,
        costPrice: 850.0,
        unit: 'portion',
        stock: 30,
        category: 'Food & Meals',
        description: 'Authentic Sri Lankan shredded godamba roti cooked on hot griddle with rich melted cheese and roast chicken.',
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400',
        isActive: true,
      },
    });

    const p3 = await this.prisma.product.create({
      data: {
        merchantId: shop2User.shopProfile?.id || 'shop-2',
        merchantName: 'SuperMart Express Kiribathgoda',
        name: 'Fresh Dairy Farm Milk 1 Litre Tetra Pak',
        sku: 'MILK-003',
        price: 480.0,
        costPrice: 380.0,
        unit: 'pack',
        stock: 120,
        category: 'Groceries & Dairy',
        description: 'Pure whole pasteurized milk enriched with vitamin D & calcium.',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400',
        isActive: true,
      },
    });

    const p4 = await this.prisma.product.create({
      data: {
        merchantId: shop3User.shopProfile?.id || 'shop-3',
        merchantName: 'HealthFirst Pharmacy & Wellness',
        name: 'Panadol Extra Paracetamol 500mg (10 Tablets)',
        sku: 'MED-004',
        price: 250.0,
        costPrice: 180.0,
        unit: 'strip',
        stock: 250,
        category: 'Pharmacy & Healthcare',
        description: 'Fast effective relief for headaches, fever, and body aches.',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400',
        isActive: true,
      },
    });

    // ─── Seed Orders & Items ─────────────────────────────────────
    const order1 = await this.prisma.order.create({
      data: {
        merchantId: shop1User.shopProfile?.id || 'shop-1',
        customerName: 'Tharindu Bandara',
        totalAmount: 2300.0,
        status: 'delivered',
        notes: 'Please ring the doorbell upon arrival.',
        items: {
          create: [
            {
              productId: p1.id,
              productName: p1.name,
              quantity: 1,
              unitPrice: 950.0,
              subtotal: 950.0,
            },
            {
              productId: p2.id,
              productName: p2.name,
              quantity: 1,
              unitPrice: 1350.0,
              subtotal: 1350.0,
            },
          ],
        },
      },
    });

    const order2 = await this.prisma.order.create({
      data: {
        merchantId: shop2User.shopProfile?.id || 'shop-2',
        customerName: 'Nadeesha Jayawardena',
        totalAmount: 960.0,
        status: 'processing',
        notes: 'Please deliver before 6 PM.',
        items: {
          create: [
            {
              productId: p3.id,
              productName: p3.name,
              quantity: 2,
              unitPrice: 480.0,
              subtotal: 960.0,
            },
          ],
        },
      },
    });

    // ─── Seed Invoices ───────────────────────────────────────────
    await this.prisma.invoice.create({
      data: {
        merchantId: shop1User.shopProfile?.id || 'shop-1',
        customerName: 'Tharindu Bandara',
        orderId: order1.id,
        amount: 2300.0,
        status: 'paid',
        paidAt: new Date(),
        notes: 'Paid via Online Card Transaction',
      },
    });

    await this.prisma.invoice.create({
      data: {
        merchantId: shop2User.shopProfile?.id || 'shop-2',
        customerName: 'Nadeesha Jayawardena',
        orderId: order2.id,
        amount: 960.0,
        status: 'pending',
        notes: 'Cash On Delivery pending rider collection',
      },
    });

    // ─── Seed Customers Table ────────────────────────────────────
    await this.prisma.customer.create({
      data: {
        name: 'Tharindu Bandara',
        mobile: '+94771234567',
        email: 'tharindu.customer@yaalu.lk',
        address: '24 Flower Road, Colombo 07',
        notes: 'VIP Customer',
      },
    });

    await this.prisma.customer.create({
      data: {
        name: 'Nadeesha Jayawardena',
        mobile: '+94761234567',
        email: 'nadeesha.customer@yaalu.lk',
        address: '15 Havelock Road, Colombo 05',
        notes: 'Regular Customer',
      },
    });

    this.logger.log('Demo platform data seeded successfully into PostgreSQL!');
  }
}
