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

    return riders.map((r) => {
      const fullName =
        r.fullName ||
        r.user?.fullName ||
        (r.user?.email ? r.user.email.split('@')[0] : 'Rider Partner');
      const phone = r.phoneNumber || r.user?.email || '';

      return {
        id: r.id,
        userId: r.userId,
        fullName,
        phone,
        email: r.user?.email || '',
        vehicleType: r.vehicleType || 'MOTORBIKE',
        vehicleNumber: r.vehicleNumber || 'WP REG-0000',
        vehicleModel: r.vehicleModel || '',
        licenseNumber: r.licenseNumber || 'LIC-00000',
        licenseExpiry: r.licenseExpiry || '',
        licenseFrontUrl: r.licenseFrontUrl || '',
        licenseBackUrl: r.licenseBackUrl || '',
        bankName: r.bankName || '',
        accountName: r.accountName || '',
        accountNo: r.accountNo || '',
        accountBranch: r.accountBranch || '',
        status: r.status,
        isApproved: r.isApproved,
        deliveriesCompleted: r.deliveriesCompleted || 0,
        rating: r.rating || 5.0,
        createdAt: r.createdAt.toISOString(),
      };
    });
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

  @Patch('riders/:id/bank')
  async updateRiderBankDetails(
    @Param('id') id: string,
    @Body() body: { bankName?: string; accountName?: string; accountNo?: string; accountBranch?: string }
  ) {
    return this.prisma.riderProfile.update({
      where: { id },
      data: {
        bankName: body.bankName,
        accountName: body.accountName,
        accountNo: body.accountNo,
        accountBranch: body.accountBranch,
      },
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

  // ─── Fare Calculation Formula & Pricing Engine ──────────────
  @Get('fare-settings')
  async getFareSettings() {
    // Default fallback presets if table is empty
    const defaultConfigs = [
      {
        id: 'THREE_WHEEL',
        vehicleType: 'THREE_WHEEL',
        vehicleName: 'Three-Wheeler / Tuk Tuk',
        petrolPrice: 370.0, // B
        twoTOilRatio: 0.02, // C (20ml per 1L)
        twoTOilPrice: 1500.0, // D
        mileageKmPerLitre: 25.0, // F
        otherRunningCostPerKm: 5.0, // G
        fixedCostPerKm: 3.0, // H
        profitMultiplier: 3.0, // J = 3I
        baseChargeFirstKm: 150.0, // K
        minimumFare: 150.0,
        commissionPercent: 10.0, // Yaalu Platform Commission %
        bidTimeoutMinutes: 2.0, // Bid Window Timeout (e.g. 2 minutes / 120s)
        isActive: true,
      },
      {
        id: 'MOTORBIKE',
        vehicleType: 'MOTORBIKE',
        vehicleName: 'Motorbike / Bike Delivery',
        petrolPrice: 370.0,
        twoTOilRatio: 0.0,
        twoTOilPrice: 0.0,
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
        bidTimeoutMinutes: 5.0,
        isActive: true,
      },
    ];

    let dbSettings: any[] = [];
    try {
      dbSettings = await (this.prisma as any).fareSetting?.findMany({
        orderBy: { createdAt: 'asc' },
      }) || [];
    } catch {
      // ignore
    }

    const configs = dbSettings.length > 0 ? dbSettings : defaultConfigs;

    return configs.map((cfg) => this.computeFormulaBreakdown(cfg));
  }

  @Patch('fare-settings')
  async updateFareSettings(@Body() body: any) {
    const vType = body.vehicleType || 'THREE_WHEEL';
    const petrolPrice = parseFloat(body.petrolPrice) || 370.0;
    const twoTOilRatio = parseFloat(body.twoTOilRatio) >= 0 ? parseFloat(body.twoTOilRatio) : 0.02;
    const twoTOilPrice = parseFloat(body.twoTOilPrice) >= 0 ? parseFloat(body.twoTOilPrice) : 1500.0;
    const mileageKmPerLitre = parseFloat(body.mileageKmPerLitre) > 0 ? parseFloat(body.mileageKmPerLitre) : 25.0;
    const otherRunningCostPerKm = parseFloat(body.otherRunningCostPerKm) >= 0 ? parseFloat(body.otherRunningCostPerKm) : 5.0;
    const fixedCostPerKm = parseFloat(body.fixedCostPerKm) >= 0 ? parseFloat(body.fixedCostPerKm) : 3.0;
    const profitMultiplier = parseFloat(body.profitMultiplier) > 0 ? parseFloat(body.profitMultiplier) : 3.0;
    const baseChargeFirstKm = parseFloat(body.baseChargeFirstKm) >= 0 ? parseFloat(body.baseChargeFirstKm) : 150.0;
    const minimumFare = parseFloat(body.minimumFare) >= 0 ? parseFloat(body.minimumFare) : baseChargeFirstKm;
    const commissionPercent = parseFloat(body.commissionPercent) >= 0 ? parseFloat(body.commissionPercent) : 10.0;
    const bidTimeoutMinutes = parseFloat(body.bidTimeoutMinutes) > 0 ? parseFloat(body.bidTimeoutMinutes) : 2.0;

    let updated: any = null;
    try {
      updated = await (this.prisma as any).fareSetting.upsert({
        where: { vehicleType: vType },
        create: {
          id: vType,
          vehicleType: vType,
          vehicleName: body.vehicleName || (vType === 'THREE_WHEEL' ? 'Three-Wheeler / Tuk Tuk' : vType),
          petrolPrice,
          twoTOilRatio,
          twoTOilPrice,
          mileageKmPerLitre,
          otherRunningCostPerKm,
          fixedCostPerKm,
          profitMultiplier,
          baseChargeFirstKm,
          minimumFare,
          commissionPercent,
          bidTimeoutMinutes,
          isActive: true,
        },
        update: {
          petrolPrice,
          twoTOilRatio,
          twoTOilPrice,
          mileageKmPerLitre,
          otherRunningCostPerKm,
          fixedCostPerKm,
          profitMultiplier,
          baseChargeFirstKm,
          minimumFare,
          commissionPercent,
          bidTimeoutMinutes,
        },
      });
    } catch (e) {
      updated = {
        id: vType,
        vehicleType: vType,
        vehicleName: body.vehicleName || vType,
        petrolPrice,
        twoTOilRatio,
        twoTOilPrice,
        mileageKmPerLitre,
        otherRunningCostPerKm,
        fixedCostPerKm,
        profitMultiplier,
        baseChargeFirstKm,
        minimumFare,
        commissionPercent,
        bidTimeoutMinutes,
        isActive: true,
      };
    }

    return this.computeFormulaBreakdown(updated);
  }

  @Post('fare-settings/calculate')
  async calculateTripFare(@Body() body: { distanceKm: number; vehicleType?: string }) {
    const distanceKm = Math.max(0, parseFloat(body.distanceKm as any) || 1.0);
    const vType = body.vehicleType || 'THREE_WHEEL';

    let config: any = null;
    try {
      config = await (this.prisma as any).fareSetting.findUnique({
        where: { vehicleType: vType },
      });
    } catch {
      // ignore
    }

    if (!config) {
      config = {
        vehicleType: vType,
        vehicleName: vType === 'THREE_WHEEL' ? 'Three-Wheeler / Tuk Tuk' : vType,
        petrolPrice: 370.0,
        twoTOilRatio: vType === 'THREE_WHEEL' ? 0.02 : 0.0,
        twoTOilPrice: 1500.0,
        mileageKmPerLitre: vType === 'THREE_WHEEL' ? 25.0 : (vType === 'MOTORBIKE' ? 45.0 : 14.0),
        otherRunningCostPerKm: 5.0,
        fixedCostPerKm: 3.0,
        profitMultiplier: 3.0,
        baseChargeFirstKm: 150.0,
        minimumFare: 150.0,
        commissionPercent: 10.0,
        bidTimeoutMinutes: 2.0,
      };
    }

    return this.computeFormulaBreakdown(config, distanceKm);
  }

  // ─── Mathematical Formula Calculator Engine ─────────────────
  private computeFormulaBreakdown(cfg: any, distanceKm?: number) {
    const B = cfg.petrolPrice || 370.0;
    const C = cfg.twoTOilRatio !== undefined ? cfg.twoTOilRatio : 0.02;
    const D = cfg.twoTOilPrice || 1500.0;
    const F = cfg.mileageKmPerLitre || 25.0;
    const G = cfg.otherRunningCostPerKm || 5.0;
    const H = cfg.fixedCostPerKm || 3.0;
    const multiplier = cfg.profitMultiplier || 3.0;
    const K = cfg.baseChargeFirstKm || 150.0;
    const minFare = cfg.minimumFare || K;
    const commissionPercent = cfg.commissionPercent !== undefined ? cfg.commissionPercent : 10.0;
    const bidTimeoutMinutes = cfg.bidTimeoutMinutes !== undefined ? cfg.bidTimeoutMinutes : 2.0;

    // Step 1 — Cost of the Fuel Mixture: A = B + (C * D)
    const A = B + (C * D);

    // Step 2 — Fuel Cost per Kilometre: E = A / F
    const E = F > 0 ? A / F : 0;

    // Step 3 — Total Operating Cost per Kilometre: I = E + G + H
    const I = E + G + H;

    // Step 4 — Rate Charged to the Customer per Kilometre: J = multiplier * I (Default: 3 * I)
    const J = multiplier * I;

    // Step 5 — Total Fare for Trip (M km): L = K + J * (M - 1) if M > 1, else K
    let L = K;
    const M = distanceKm !== undefined ? distanceKm : 1.0;
    if (M > 1.0) {
      L = K + J * (M - 1.0);
    }
    L = Math.max(L, minFare);

    // Platform Commission & Rider Earnings Calculation
    const commissionAmount = Math.round(L * (commissionPercent / 100) * 100) / 100;
    const riderNetEarnings = Math.round((L - commissionAmount) * 100) / 100;
    const bidTimeoutSeconds = Math.round(bidTimeoutMinutes * 60);

    return {
      ...cfg,
      commissionPercent,
      bidTimeoutMinutes,
      bidTimeoutSeconds,
      variables: {
        A_fuelMixtureCostPerLitre: Math.round(A * 100) / 100, // Cost of petrol + 2T oil per litre
        B_petrolPricePerLitre: B,
        C_twoTOilRatioPerLitre: C,
        D_twoTOilPricePerLitre: D,
        E_fuelCostPerKm: Math.round(E * 100) / 100, // Fuel cost per 1 km
        F_mileageKmPerLitre: F,
        G_runningCostPerKm: G,
        H_fixedCostPerKm: H,
        I_driverOperatingCostPerKm: Math.round(I * 100) / 100, // Driver's true cost per 1 km
        J_customerRatePerKm: Math.round(J * 100) / 100, // Final 1 km hire fee charged to customer (3 * I)
        K_baseChargeFirstKm: K, // 1st km base fare
        M_distanceKm: M,
        L_totalTripFare: Math.round(L * 100) / 100, // Total trip passenger fare
        commissionPercent,
        commissionAmount,
        riderNetEarnings,
        bidTimeoutMinutes,
        bidTimeoutSeconds,
      },
      formulaSummary: {
        step1: `A = B + (C × D) = ${B} + (${C} × ${D}) = LKR ${A.toFixed(2)}/L`,
        step2: `E = A / F = ${A.toFixed(2)} / ${F} = LKR ${E.toFixed(2)}/km`,
        step3: `I = E + G + H = ${E.toFixed(2)} + ${G} + ${H} = LKR ${I.toFixed(2)}/km`,
        step4: `J = ${multiplier} × I = ${multiplier} × ${I.toFixed(2)} = LKR ${J.toFixed(2)}/km`,
        step5: `L = ${K} + ${J.toFixed(2)} × (${M} - 1) = LKR ${L.toFixed(2)}`,
        commission: `Yaalu Commission (${commissionPercent}%): LKR ${commissionAmount.toFixed(2)} | Rider Net: LKR ${riderNetEarnings.toFixed(2)}`,
        bidTimeout: `Bid Window: ${bidTimeoutMinutes} minutes (${bidTimeoutSeconds} seconds)`,
      },
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
