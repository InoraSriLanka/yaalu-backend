import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { PrismaService } from '@app/common';

@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ───────────────────────────────────────────────
  @Get('stats')
  async getStats() {
    const [totalMerchants, totalRiders, totalUsers, totalOrders] = await Promise.all([
      this.prisma.shopProfile.count(),
      this.prisma.riderProfile.count(),
      this.prisma.user.count(),
      this.prisma.order.count(),
    ]);
    const pendingRiders = await this.prisma.riderProfile.count({ where: { isApproved: false } });
    const activeRiders = await this.prisma.riderProfile.count({ where: { status: 'AVAILABLE' } });
    return {
      totalRevenue: 0,
      totalOrders,
      totalMerchants,
      activeRiders,
      pendingApprovals: pendingRiders,
      pendingPaymentsCount: 0,
      totalUsers,
      todayOrders: 0,
      monthlyGrowth: 0,
    };
  }

  // ─── Users ───────────────────────────────────────────────
  @Get('users')
  async getUsers(@Query('role') role?: string) {
    const users = await this.prisma.user.findMany({
      where: role && role !== 'ALL' ? { role: role as any } : undefined,
      include: { customerProfile: true, shopProfile: true, riderProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.customerProfile?.fullName || u.shopProfile?.ownerName || u.email.split('@')[0],
      phone: u.customerProfile?.phone || u.shopProfile?.ownerPhone || '',
      status: 'ACTIVE',
      avatarUrl: undefined,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      customerProfile: u.customerProfile
        ? { deliveryAddress: u.customerProfile.deliveryAddress, city: u.customerProfile.city, fullName: u.customerProfile.fullName, phone: u.customerProfile.phone }
        : undefined,
      shopProfile: u.shopProfile
        ? {
            shopName: u.shopProfile.shopName,
            businessType: u.shopProfile.businessType,
            registrationNo: u.shopProfile.registrationNo,
            shopAddress: u.shopProfile.shopAddress,
            isVerified: true,
          }
        : undefined,
      riderProfile: u.riderProfile
        ? {
            vehicleType: u.riderProfile.vehicleType,
            vehicleNumber: u.riderProfile.vehicleNumber,
            licenseNumber: u.riderProfile.licenseNumber,
            isApproved: u.riderProfile.isApproved,
          }
        : undefined,
    }));
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    if (body.role || body.email) {
      await this.prisma.user.update({
        where: { id },
        data: {
          ...(body.role && { role: body.role }),
          ...(body.email && { email: body.email }),
        },
      });
    }

    if (body.customerProfile || body.fullName || body.phone || body.deliveryAddress) {
      const cp = body.customerProfile || {};
      await this.prisma.customerProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          fullName: cp.fullName || body.fullName,
          phone: cp.phone || body.phone,
          deliveryAddress: cp.deliveryAddress || body.deliveryAddress,
          city: cp.city || body.city,
        },
        update: {
          ...(body.fullName !== undefined && { fullName: body.fullName }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(cp.fullName !== undefined && { fullName: cp.fullName }),
          ...(cp.phone !== undefined && { phone: cp.phone }),
          ...(cp.deliveryAddress !== undefined && { deliveryAddress: cp.deliveryAddress }),
          ...(cp.city !== undefined && { city: cp.city }),
        },
      });
    }

    if (body.shopProfile) {
      await this.prisma.shopProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          shopName: body.shopProfile.shopName || body.fullName,
          businessType: body.shopProfile.businessType,
          registrationNo: body.shopProfile.registrationNo,
          shopAddress: body.shopProfile.shopAddress,
        },
        update: {
          ...(body.shopProfile.shopName && { shopName: body.shopProfile.shopName }),
          ...(body.shopProfile.businessType && { businessType: body.shopProfile.businessType }),
          ...(body.shopProfile.registrationNo && { registrationNo: body.shopProfile.registrationNo }),
          ...(body.shopProfile.shopAddress && { shopAddress: body.shopProfile.shopAddress }),
        },
      });
    }

    return { success: true };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  // ─── Merchants ───────────────────────────────────────────
  @Get('merchants')
  async getMerchants() {
    const shops = await this.prisma.shopProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return shops.map((s) => {
      const shop = s as any;
      return {
        id: shop.id,
        userId: shop.userId,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        ownerEmail: shop.ownerEmail || shop.user?.email,
        ownerPhone: shop.ownerPhone,
        businessType: shop.businessType,
        shopAddress: shop.shopAddress || shop.outletAddress,
        outletAddress: shop.outletAddress,
        registrationNo: shop.registrationNo,
        logoUrl: shop.logoUrl,
        bannerUrl: shop.bannerUrl,
        bankName: shop.bankName,
        accountName: shop.accountName,
        accountNo: shop.accountNo,
        accountBranch: shop.accountBranch,
        cardLast4: shop.cardLast4,
        cardType: shop.cardType,
        status: 'ACTIVE',
        isVerified: true,
        createdAt: shop.createdAt.toISOString(),
      };
    });
  }

  @Patch('merchants/:id/verify')
  async verifyMerchant(@Param('id') id: string, @Body() body: { isVerified: boolean }) {
    const shop = await this.prisma.shopProfile.findUnique({ where: { id } });
    if (!shop) throw new Error('Merchant not found');
    return {
      ...shop,
      status: body.isVerified ? 'ACTIVE' : 'SUSPENDED',
      isVerified: body.isVerified,
    };
  }

  @Patch('merchants/:id')
  async updateMerchant(@Param('id') id: string, @Body() body: any) {
    return this.prisma.shopProfile.update({
      where: { id },
      data: {
        ...(body.shopName !== undefined && { shopName: body.shopName }),
        ...(body.ownerName !== undefined && { ownerName: body.ownerName }),
        ...(body.ownerEmail !== undefined && { ownerEmail: body.ownerEmail }),
        ...(body.ownerPhone !== undefined && { ownerPhone: body.ownerPhone }),
        ...(body.businessType !== undefined && { businessType: body.businessType }),
        ...(body.shopAddress !== undefined && { shopAddress: body.shopAddress }),
        ...(body.outletAddress !== undefined && { outletAddress: body.outletAddress }),
        ...(body.registrationNo !== undefined && { registrationNo: body.registrationNo }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.bannerUrl !== undefined && { bannerUrl: body.bannerUrl }),
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.accountName !== undefined && { accountName: body.accountName }),
        ...(body.accountNo !== undefined && { accountNo: body.accountNo }),
        ...(body.accountBranch !== undefined && { accountBranch: body.accountBranch }),
        ...(body.cardLast4 !== undefined && { cardLast4: body.cardLast4 }),
        ...(body.cardType !== undefined && { cardType: body.cardType }),
      },
    });
  }

  @Patch('merchants/:id/bank')
  async updateMerchantBank(@Param('id') id: string, @Body() body: any) {
    return (this.prisma.shopProfile as any).update({
      where: { id },
      data: {
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.accountName !== undefined && { accountName: body.accountName }),
        ...(body.accountNo !== undefined && { accountNo: body.accountNo }),
        ...(body.accountBranch !== undefined && { accountBranch: body.accountBranch }),
        ...(body.cardLast4 !== undefined && { cardLast4: body.cardLast4 }),
        ...(body.cardType !== undefined && { cardType: body.cardType }),
      },
    });
  }

  // ─── Riders ──────────────────────────────────────────────
  @Get('riders')
  async getRiders() {
    const riders = await this.prisma.riderProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return riders.map((r) => {
      const rider = r as any;
      return {
        id: rider.id,
        userId: rider.userId,
        fullName: rider.user?.email?.split('@')[0] || 'Rider',
        phone: '',
        email: rider.user?.email,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        vehicleModel: rider.vehicleModel,
        licenseNumber: rider.licenseNumber,
        status: rider.status,
        isApproved: rider.isApproved,
        currentLatitude: rider.currentLatitude,
        currentLongitude: rider.currentLongitude,
        bankName: rider.bankName,
        accountName: rider.accountName,
        accountNo: rider.accountNo,
        accountBranch: rider.accountBranch,
        createdAt: rider.createdAt.toISOString(),
      };
    });
  }

  @Patch('riders/:id/status')
  async updateRiderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.riderProfile.update({
      where: { id },
      data: { status: body.status as any },
    });
  }

  @Patch('riders/:id/approve')
  async approveRider(@Param('id') id: string, @Body() body: { isApproved: boolean }) {
    return this.prisma.riderProfile.update({
      where: { id },
      data: {
        isApproved: body.isApproved,
        status: body.isApproved ? 'AVAILABLE' : 'PENDING',
      },
    });
  }

  @Patch('riders/:id/bank')
  async updateRiderBank(@Param('id') id: string, @Body() body: any) {
    return (this.prisma.riderProfile as any).update({
      where: { id },
      data: {
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.accountName !== undefined && { accountName: body.accountName }),
        ...(body.accountNo !== undefined && { accountNo: body.accountNo }),
        ...(body.accountBranch !== undefined && { accountBranch: body.accountBranch }),
      },
    });
  }

  // ─── Customers ───────────────────────────────────────────
  @Get('customers')
  async getCustomers() {
    const profiles = await this.prisma.customerProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.fullName || p.user?.email?.split('@')[0] || 'Customer',
      email: p.user?.email || '',
      mobile: p.phone || '',
      address: p.deliveryAddress || '',
      city: p.city || '',
      cardLast4: p.cardLast4,
      cardType: p.cardType,
      billingAddress: p.billingAddress,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  @Get('customers/users')
  async getCustomerUsers() {
    return this.getCustomers();
  }

  @Patch('customers/:id')
  async updateCustomer(@Param('id') id: string, @Body() body: any) {
    const updated = await this.prisma.customerProfile.update({
      where: { id },
      data: {
        ...(body.cardLast4 !== undefined && { cardLast4: body.cardLast4 }),
        ...(body.cardType !== undefined && { cardType: body.cardType }),
        ...(body.billingAddress !== undefined && { billingAddress: body.billingAddress }),
        ...(body.deliveryAddress !== undefined && { deliveryAddress: body.deliveryAddress }),
        ...(body.address !== undefined && { deliveryAddress: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.name !== undefined && { fullName: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.mobile !== undefined && { phone: body.mobile }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: { user: true },
    });

    if (body.email && updated.userId) {
      await this.prisma.user.update({
        where: { id: updated.userId },
        data: { email: body.email },
      });
    }

    return {
      id: updated.id,
      userId: updated.userId,
      name: body.name || body.fullName || updated.fullName || updated.user?.email?.split('@')[0] || 'Customer',
      email: body.email || updated.user?.email || '',
      mobile: body.mobile || body.phone || updated.phone || '',
      address: body.address || body.deliveryAddress || updated.deliveryAddress || '',
      city: body.city || updated.city || '',
      cardLast4: updated.cardLast4,
      cardType: updated.cardType,
      billingAddress: updated.billingAddress,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  @Patch('customers/:id/card')
  async updateCustomerCard(@Param('id') id: string, @Body() body: any) {
    return this.updateCustomer(id, body);
  }

  // ─── Orders ──────────────────────────────────────────────
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
      data: { status: body.status as any },
    });
  }

  // ─── Products ────────────────────────────────────────────
  @Get('products')
  async getProducts() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('products')
  async createProduct(@Body() body: any) {
    return this.prisma.product.create({
      data: {
        merchantId: body.merchantId || 'default',
        name: body.name,
        price: body.price !== undefined ? parseFloat(body.price) : 0,
        unit: body.unit || 'unit',
        stock: body.stock !== undefined ? parseInt(body.stock) : 0,
        imageUrl: body.imageUrl,
        description: body.description,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.price !== undefined && !isNaN(Number(body.price))) data.price = Number(body.price);
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.stock !== undefined && !isNaN(Number(body.stock))) data.stock = parseInt(body.stock, 10);
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.description !== undefined) data.description = body.description;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  @Put('products/:id')
  async putProduct(@Param('id') id: string, @Body() body: any) {
    return this.updateProduct(id, body);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  // ─── Invoices ────────────────────────────────────────────
  @Get('invoices')
  async getInvoices() {
    return this.prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Patch('invoices/:id/pay')
  async markInvoicePaid(@Param('id') id: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });
  }
}
