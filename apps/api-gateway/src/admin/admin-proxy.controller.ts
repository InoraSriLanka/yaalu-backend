import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from '@app/common';
import * as bcrypt from 'bcrypt';

@Controller('admin')
export class AdminProxyController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Admin Login ────────────────────────────────────────────
  @Post('login')
  async adminLogin(@Body() body: { email: string; password?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });

    if (!user) {
      throw new Error('Administrator account not found');
    }

    if (user.role !== 'ADMIN') {
      throw new Error('Access denied. This account is not an administrator.');
    }

    // Check password if user has one set
    if (user.password && body.password) {
      const valid = await bcrypt.compare(body.password, user.password);
      if (!valid) {
        throw new Error('Invalid password');
      }
    }

    const accessToken = 'admin-token-' + user.id;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: 'System Administrator',
        role: user.role,
        status: 'ACTIVE',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // ─── Users CRUD (with profiles) ────────────────────────────
  @Get('users')
  async getUsers(@Query('role') role?: string) {
    const where: any = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match admin frontend's UserAccount format
    return users.map((u) => this.formatUserForAdmin(u));
  }

  @Post('users')
  async createUser(@Body() body: any) {
    const hashedPassword = body.password
      ? await bcrypt.hash(body.password, 10)
      : await bcrypt.hash('Temporary@123', 10);

    const role = (body.role || 'CUSTOMER').toUpperCase();

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        role,
        password: hashedPassword,
      },
    });

    // Create role-specific profile
    if (role === 'CUSTOMER') {
      await this.prisma.customerProfile.create({
        data: {
          userId: user.id,
          fullName: body.fullName || '',
          phoneNumber: body.phone || '',
          deliveryAddress: body.customerProfile?.deliveryAddress || '',
          city: body.customerProfile?.city || '',
        } as any,
      });
    } else if (role === 'SHOP') {
      await this.prisma.shopProfile.create({
        data: {
          userId: user.id,
          shopName: body.shopProfile?.shopName || 'New Shop',
          ownerName: body.fullName || '',
          ownerPhone: body.phone || '',
          businessType: body.shopProfile?.businessType || '',
          shopAddress: body.shopProfile?.shopAddress || '',
          registrationNo: body.shopProfile?.registrationNo || '',
        },
      });
    } else if (role === 'RIDER') {
      await this.prisma.riderProfile.create({
        data: {
          userId: user.id,
          vehicleType: body.riderProfile?.vehicleType || 'MOTORBIKE',
          vehicleNumber: body.riderProfile?.vehicleNumber || '',
          licenseNumber: body.riderProfile?.licenseNumber || '',
          status: body.status === 'ACTIVE' ? 'AVAILABLE' : 'PENDING',
          isApproved: body.status === 'ACTIVE',
        },
      });
    }

    // Re-fetch with profiles
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });

    return this.formatUserForAdmin(fullUser);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    const userUpdate: any = {};
    if (body.email) userUpdate.email = body.email;
    if (body.role) userUpdate.role = body.role;

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: userUpdate,
      });
    }

    // Update role-specific profile
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { customerProfile: true, shopProfile: true, riderProfile: true },
    });

    if (!user) throw new Error('User not found');

    if (user.role === 'CUSTOMER') {
      await this.prisma.customerProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          fullName: body.fullName || '',
          phoneNumber: body.phone || '',
          deliveryAddress: body.customerProfile?.deliveryAddress || '',
          city: body.customerProfile?.city || '',
        } as any,
        update: {
          ...(body.fullName && { fullName: body.fullName }),
          ...(body.phone && { phoneNumber: body.phone }),
          ...(body.customerProfile?.deliveryAddress && { deliveryAddress: body.customerProfile.deliveryAddress }),
          ...(body.customerProfile?.city && { city: body.customerProfile.city }),
        },
      });
    } else if (user.role === 'SHOP') {
      await this.prisma.shopProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          shopName: body.shopProfile?.shopName || 'New Shop',
          ownerName: body.fullName || '',
          ownerPhone: body.phone || '',
          businessType: body.shopProfile?.businessType || '',
          shopAddress: body.shopProfile?.shopAddress || '',
          registrationNo: body.shopProfile?.registrationNo || '',
        },
        update: {
          ...(body.fullName && { ownerName: body.fullName }),
          ...(body.phone && { ownerPhone: body.phone }),
          ...(body.shopProfile?.shopName && { shopName: body.shopProfile.shopName }),
          ...(body.shopProfile?.businessType && { businessType: body.shopProfile.businessType }),
          ...(body.shopProfile?.shopAddress && { shopAddress: body.shopProfile.shopAddress }),
          ...(body.shopProfile?.registrationNo && { registrationNo: body.shopProfile.registrationNo }),
        },
      });
    } else if (user.role === 'RIDER') {
      await this.prisma.riderProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          vehicleType: body.riderProfile?.vehicleType || 'MOTORBIKE',
          vehicleNumber: body.riderProfile?.vehicleNumber || '',
          licenseNumber: body.riderProfile?.licenseNumber || '',
        },
        update: {
          ...(body.riderProfile?.vehicleType && { vehicleType: body.riderProfile.vehicleType }),
          ...(body.riderProfile?.vehicleNumber && { vehicleNumber: body.riderProfile.vehicleNumber }),
          ...(body.riderProfile?.licenseNumber && { licenseNumber: body.riderProfile.licenseNumber }),
        },
      });
    }

    // Re-fetch full user
    const fullUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });

    return this.formatUserForAdmin(fullUser);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Merchants (all shops across platform) ─────────────────
  @Get('merchants')
  async getMerchants() {
    const shops = await this.prisma.shopProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return shops.map((s) => ({
      id: s.id,
      userId: s.userId,
      shopName: s.shopName,
      ownerName: s.ownerName || '',
      ownerEmail: s.ownerEmail || s.user?.email || '',
      ownerPhone: s.ownerPhone || '',
      businessType: s.businessType || '',
      shopAddress: s.shopAddress || '',
      outletAddress: s.outletAddress || '',
      registrationNo: s.registrationNo || '',
      status: 'ACTIVE',
      isVerified: true,
      totalProducts: 0,
      totalOrders: 0,
      revenue: 0,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  @Patch('merchants/:id/verify')
  async verifyMerchant(@Param('id') id: string, @Body() body: { isVerified: boolean }) {
    const shop = await this.prisma.shopProfile.findUnique({ where: { id } });
    if (!shop) throw new Error('Merchant not found');
    return { ...shop, isVerified: body.isVerified, status: body.isVerified ? 'ACTIVE' : 'SUSPENDED' };
  }

  // ─── Riders (all rider profiles) ───────────────────────────
  @Get('riders')
  async getRiders() {
    const riders = await this.prisma.riderProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return riders.map((r) => ({
      id: r.id,
      userId: r.userId,
      fullName: r.user?.email?.split('@')[0] || '',
      phone: '',
      email: r.user?.email || '',
      vehicleType: r.vehicleType,
      vehicleNumber: r.vehicleNumber,
      vehicleModel: r.vehicleModel || '',
      licenseNumber: r.licenseNumber,
      status: r.status,
      isApproved: r.isApproved,
      deliveriesCompleted: 0,
      rating: 5.0,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  @Patch('riders/:id/approve')
  async approveRider(@Param('id') id: string, @Body() body: { isApproved: boolean }) {
    return this.prisma.riderProfile.update({
      where: { id },
      data: {
        isApproved: body.isApproved,
        status: body.isApproved ? 'AVAILABLE' : 'SUSPENDED',
      },
    });
  }

  @Patch('riders/:id/status')
  async updateRiderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.riderProfile.update({
      where: { id },
      data: { status: body.status as any },
    });
  }

  // ─── Products (ALL products, no merchant filter) ───────────
  @Get('products')
  async getProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Orders (ALL orders, no merchant filter) ───────────────
  @Get('orders')
  async getOrders() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.order.update({
      where: { id },
      data: { status: body.status.toLowerCase() as any },
      include: { items: true },
    });
  }

  // ─── Invoices (ALL invoices) ───────────────────────────────
  @Get('invoices')
  async getInvoices() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('invoices/:id/pay')
  async markInvoicePaid(@Param('id') id: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });
  }

  // ─── Customers (ALL customers) ─────────────────────────────
  @Get('customers')
  async getCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Platform Stats ────────────────────────────────────────
  @Get('stats')
  async getStats() {
    const [userCount, shopCount, riderCount, productCount, orders, invoices] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.shopProfile.count(),
      this.prisma.riderProfile.count({ where: { status: { in: ['AVAILABLE', 'BUSY'] } } }),
      this.prisma.product.count(),
      this.prisma.order.findMany(),
      this.prisma.invoice.findMany(),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const pendingRiders = await this.prisma.riderProfile.count({ where: { isApproved: false } });

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalMerchants: shopCount,
      activeRiders: riderCount,
      pendingApprovals: pendingRiders,
      pendingPaymentsCount: 0,
      totalUsers: userCount,
      todayOrders: orders.length,
      monthlyGrowth: 0,
    };
  }

  // ─── Helper: Format DB user to admin frontend format ───────
  private formatUserForAdmin(user: any) {
    if (!user) return null;

    const cp = user.customerProfile;
    const sp = user.shopProfile;
    const rp = user.riderProfile;

    // Derive fullName from the relevant profile
    let fullName = '';
    let phone = '';
    if (user.role === 'CUSTOMER' && cp) {
      fullName = cp.fullName || '';
      phone = cp.phoneNumber || '';
    } else if (user.role === 'SHOP' && sp) {
      fullName = sp.ownerName || '';
      phone = sp.ownerPhone || '';
    } else if (user.role === 'RIDER' && rp) {
      fullName = '';
      phone = '';
    }

    if (!fullName) {
      fullName = user.email?.split('@')[0] || 'User';
    }

    // Derive status
    let status = 'ACTIVE';
    if (user.role === 'RIDER' && rp) {
      status = rp.isApproved ? 'ACTIVE' : 'PENDING';
    }

    return {
      id: user.id,
      email: user.email,
      fullName,
      phone,
      role: user.role,
      status,
      createdAt: user.createdAt?.toISOString?.() || user.createdAt,
      updatedAt: user.updatedAt?.toISOString?.() || user.updatedAt,
      // Include profile sub-objects for the admin to display
      customerProfile: cp
        ? {
            deliveryAddress: cp.deliveryAddress || '',
            city: cp.city || '',
            nicNumber: cp.nicNumber || '',
            profilePicture: cp.profilePicture || '',
          }
        : undefined,
      shopProfile: sp
        ? {
            shopName: sp.shopName || '',
            businessType: sp.businessType || '',
            registrationNo: sp.registrationNo || '',
            shopAddress: sp.shopAddress || '',
            isVerified: true,
          }
        : undefined,
      riderProfile: rp
        ? {
            vehicleType: rp.vehicleType || '',
            vehicleNumber: rp.vehicleNumber || '',
            licenseNumber: rp.licenseNumber || '',
            isApproved: rp.isApproved || false,
          }
        : undefined,
    };
  }
}
