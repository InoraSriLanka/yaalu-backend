import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@app/common';
import { AuthService } from '@app/auth-service/auth/auth.service';
import * as bcrypt from 'bcrypt';

@ApiTags('Riders')
@Controller('riders')
export class RidersProxyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ─── Helper: decode token and get rider ──────────────────
  private async getRiderFromToken(token: string) {
    if (!token) throw new Error('Authorization token required');
    let userId = '';
    if (token.startsWith('dev-token-')) {
      userId = token.replace('dev-token-', '');
    } else if (token.startsWith('rider-token-')) {
      userId = token.replace('rider-token-', '');
    } else {
      userId = token;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { riderProfile: true },
    });

    if (!user || !user.riderProfile) {
      throw new Error('Rider profile not found');
    }
    return { user, riderProfile: user.riderProfile };
  }

  // ─── Helper: Find rider user by mobile/email ─────────────
  private async findRiderByIdentifier(identifier: string) {
    if (!identifier) return null;
    const cleaned = identifier.replace(/[\s\-()]/g, '');

    // Build phone variants (Sri Lanka numbers)
    const variants = new Set<string>([identifier, cleaned]);
    if (cleaned.startsWith('+94')) {
      variants.add('0' + cleaned.substring(3));
      variants.add(cleaned.substring(3));
    } else if (cleaned.startsWith('0')) {
      variants.add('+94' + cleaned.substring(1));
      variants.add(cleaned.substring(1));
    } else if (cleaned.startsWith('94')) {
      variants.add('+' + cleaned);
      variants.add('0' + cleaned.substring(2));
    } else {
      variants.add('+94' + cleaned);
      variants.add('0' + cleaned);
    }
    const variantList = Array.from(variants);

    // Try email first
    const byEmail = await this.prisma.user.findFirst({
      where: { email: { in: variantList } },
      include: { riderProfile: true },
    });
    if (byEmail) return byEmail;

    // Try phone stored as email (riders registered via OTP store phone as email)
    const byPhoneEmail = await this.prisma.user.findFirst({
      where: {
        OR: variantList.map((v) => ({ email: v })),
        role: 'RIDER',
      },
      include: { riderProfile: true },
    });
    if (byPhoneEmail) return byPhoneEmail;

    return null;
  }

  // ─── AUTH ────────────────────────────────────────────────

  /** POST /riders/login — login by mobile+password or OTP */
  @Post('login')
  @ApiOperation({ summary: 'Rider login with mobile/email and password' })
  async login(@Body() body: { mobile?: string; email?: string; password: string }) {
    const identifier = (body.mobile || body.email || '').trim();
    if (!identifier) throw new Error('Mobile number or email is required');

    const user = await this.findRiderByIdentifier(identifier);

    if (!user) throw new Error('Rider account not found. Please register first.');
    if (user.role !== 'RIDER') throw new Error('This account is not a rider account');
    if (!user.password) throw new Error('No password set. Please login with OTP.');

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) throw new Error('Invalid password. Please try again.');

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { riderProfile: true },
    });

    const riderProfile = fullUser?.riderProfile;
    const token = 'rider-token-' + user.id;

    return {
      accessToken: token,
      token,
      rider: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        vehicleType: riderProfile?.vehicleType,
        vehicleNumber: riderProfile?.vehicleNumber,
        vehicleModel: riderProfile?.vehicleModel,
        licenseNumber: riderProfile?.licenseNumber,
        status: riderProfile?.status || 'AVAILABLE',
        isApproved: riderProfile?.isApproved || false,
        bankName: riderProfile?.bankName,
        accountName: riderProfile?.accountName,
        accountNo: riderProfile?.accountNo,
        accountBranch: riderProfile?.accountBranch,
        currentLatitude: riderProfile?.currentLatitude,
        currentLongitude: riderProfile?.currentLongitude,
      },
    };
  }

  /** POST /riders/send-otp */
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to rider mobile' })
  async sendOtp(@Body() body: { mobile: string }) {
    return this.authService.sendOtp(body.mobile);
  }

  /** POST /riders/verify-otp */
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for rider' })
  async verifyOtp(@Body() body: { mobile: string; otp: string }) {
    return this.authService.verifyOtp(body.mobile, body.otp);
  }

  /** POST /riders/register — register new rider account */
  @Post('register')
  @ApiOperation({ summary: 'Register a new rider account' })
  async register(@Body() body: any) {
    const mobile = (body.mobile || body.phone || body.contactNumber || '').trim();
    const email = (body.email || mobile).trim(); // use phone as email if no email provided
    const password = body.password || 'Temporary@123';

    if (!mobile && !email) throw new Error('Mobile number or email is required');

    // Check for existing user
    const existing = await this.findRiderByIdentifier(email) ||
      (mobile ? await this.findRiderByIdentifier(mobile) : null);

    const bcryptLib = require('bcrypt');
    const hashedPassword = await bcryptLib.hash(password, 10);

    let user: any;
    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: email || existing.email,
          fullName: body.fullName || body.name || existing.fullName,
          role: 'RIDER',
          password: hashedPassword,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: body.fullName || body.name || '',
          role: 'RIDER',
          password: hashedPassword,
        },
      });
    }

    // Upsert RiderProfile
    const vehicleType = body.vehicleType || body.vehicle_type || 'MOTORBIKE';
    const vehicleNumber = body.vehicleNumber || body.vehicle_number || body.plateNumber || '';
    const licenseNumber = body.licenseNumber || body.license_number || '';

    await this.prisma.riderProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        vehicleModel: body.vehicleModel || '',
        isApproved: false,
        status: 'PENDING',
        phone: mobile,
        address: body.address || '',
        city: body.city || '',
        nicNumber: body.nicNumber || body.nic || '',
        profilePhotoUrl: body.profilePhotoUrl || '',
        bankName: body.bankName || '',
        accountName: body.accountName || body.accountHolder || '',
        accountNo: body.accountNo || body.accountNumber || '',
        accountBranch: body.accountBranch || body.branchCode || '',
      },
      update: {
        vehicleType: body.vehicleType || undefined,
        vehicleNumber: body.vehicleNumber || undefined,
        licenseNumber: body.licenseNumber || undefined,
        vehicleModel: body.vehicleModel || undefined,
        phone: mobile || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        nicNumber: body.nicNumber || body.nic || undefined,
        profilePhotoUrl: body.profilePhotoUrl || undefined,
        bankName: body.bankName || undefined,
        accountName: body.accountName || body.accountHolder || undefined,
        accountNo: body.accountNo || body.accountNumber || undefined,
        accountBranch: body.accountBranch || body.branchCode || undefined,
      },
    });

    const token = 'rider-token-' + user.id;
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { riderProfile: true },
    });
    const riderProfile = fullUser?.riderProfile;

    return {
      accessToken: token,
      token,
      rider: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        vehicleType: riderProfile?.vehicleType,
        vehicleNumber: riderProfile?.vehicleNumber,
        status: riderProfile?.status || 'PENDING',
        isApproved: riderProfile?.isApproved || false,
      },
    };
  }

  /** POST /riders/create-password */
  @Post('create-password')
  @ApiOperation({ summary: 'Set password after OTP verification' })
  async createPassword(@Body() body: any) {
    return this.authService['createPassword'](body);
  }

  // ─── PROFILE ─────────────────────────────────────────────

  /** GET /riders/me?token=xxx */
  @Get('me')
  @ApiOperation({ summary: 'Get rider profile' })
  async getProfile(@Query('token') token: string) {
    const { user, riderProfile } = await this.getRiderFromToken(token);
    return this.formatRiderResponse(user, riderProfile);
  }

  /** PATCH /riders/me?token=xxx */
  @Patch('me')
  @ApiOperation({ summary: 'Update rider profile' })
  async updateProfile(
    @Query('token') token: string,
    @Body() body: {
      fullName?: string;
      vehicleType?: string;
      vehicleNumber?: string;
      vehicleModel?: string;
      licenseNumber?: string;
      bankName?: string;
      accountName?: string;
      accountNo?: string;
      accountBranch?: string;
    },
  ) {
    const { user, riderProfile } = await this.getRiderFromToken(token);

    // Note: User model has no fullName field; fullName is stored in profile tables only

    const updated = await this.prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        vehicleType: body.vehicleType || undefined,
        vehicleNumber: body.vehicleNumber || undefined,
        vehicleModel: body.vehicleModel || undefined,
        licenseNumber: body.licenseNumber || undefined,
        bankName: body.bankName || undefined,
        accountName: body.accountName || undefined,
        accountNo: body.accountNo || undefined,
        accountBranch: body.accountBranch || undefined,
      },
    });

    const updatedUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    return this.formatRiderResponse(updatedUser, updated);
  }

  /** PATCH /riders/me/status?token=xxx — go online/offline */
  @Patch('me/status')
  @ApiOperation({ summary: 'Update rider online/offline status' })
  async updateStatus(
    @Query('token') token: string,
    @Body() body: { status: 'AVAILABLE' | 'OFFLINE' | 'BUSY' },
  ) {
    const { riderProfile } = await this.getRiderFromToken(token);
    const updated = await this.prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: { status: body.status as any },
    });
    return { success: true, status: updated.status };
  }

  /** PATCH /riders/me/location?token=xxx */
  @Patch('me/location')
  @ApiOperation({ summary: 'Update rider GPS location' })
  async updateLocation(
    @Query('token') token: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    const { riderProfile } = await this.getRiderFromToken(token);
    await this.prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        currentLatitude: body.latitude,
        currentLongitude: body.longitude,
      },
    });
    return { success: true };
  }

  // ─── ORDERS / DELIVERIES ─────────────────────────────────

  /** GET /riders/me/orders?token=xxx&status=delivered */
  @Get('me/orders')
  @ApiOperation({ summary: 'Get orders assigned to this rider' })
  async getMyOrders(
    @Query('token') token: string,
    @Query('status') status?: string,
  ) {
    const { user } = await this.getRiderFromToken(token);

    const orders = await this.prisma.order.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.formatOrder(o));
  }

  @Get('orders/available')
  @ApiOperation({ summary: 'Get available orders for bidding' })
  async getAvailableOrders(@Query('token') token: string) {
    await this.getRiderFromToken(token); // auth check

    const rides = await this.prisma.rideRequest.findMany({
      where: { status: 'SEARCHING' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return rides.map((r) => ({
      id: r.id,
      orderNumber: `YL-${r.id.substring(0, 4).toUpperCase()}`,
      fare: r.finalFare || 1000,
      pickupAddress: r.pickupAddress || 'Customer Location',
      dropoffAddress: r.dropoffAddress || 'Destination',
      status: r.status,
      rideType: r.rideType || 'STANDARD',
    }));
  }

  @Patch('orders/:orderId/accept')
  @ApiOperation({ summary: 'Accept a direct order' })
  async acceptOrder(
    @Param('orderId') orderId: string,
    @Query('token') token: string,
  ) {
    const { user } = await this.getRiderFromToken(token);

    const ride = await this.prisma.rideRequest.update({
      where: { id: orderId },
      data: { status: 'ACCEPTED', acceptedDriverId: user.id },
    });

    return {
      id: ride.id,
      orderNumber: `YL-${ride.id.substring(0, 4).toUpperCase()}`,
      fare: ride.finalFare || 1000,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
      status: ride.status,
      rideType: ride.rideType,
    };
  }

  /** PATCH /riders/orders/:orderId/status?token=xxx */
  @Patch('orders/:orderId/status')
  @ApiOperation({ summary: 'Update delivery status of an order' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Query('token') token: string,
    @Body() body: { status: string },
  ) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: body.status as any },
      include: { items: true },
    });
    return this.formatOrder(order);
  }

  // ─── EARNINGS ────────────────────────────────────────────

  /** GET /riders/me/earnings?token=xxx&period=daily|weekly|monthly */
  @Get('me/earnings')
  @ApiOperation({ summary: 'Get rider earnings summary' })
  async getEarnings(
    @Query('token') token: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    const { user } = await this.getRiderFromToken(token);

    const now = new Date();
    let since: Date;
    if (period === 'daily') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      const day = now.getDay();
      since = new Date(now);
      since.setDate(now.getDate() - day);
      since.setHours(0, 0, 0, 0);
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'delivered' as any,
        createdAt: { gte: since },
      },
    });

    const totalEarnings = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount) * 0.8, // 80% to rider
      0
    );

    return {
      period,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      totalDeliveries: orders.length,
      avgPerDelivery: orders.length > 0
        ? parseFloat((totalEarnings / orders.length).toFixed(2))
        : 0,
    };
  }

  // ─── BANK DETAILS ────────────────────────────────────────

  /** GET /riders/me/bank?token=xxx */
  @Get('me/bank')
  @ApiOperation({ summary: 'Get rider bank payout details' })
  async getBankDetails(@Query('token') token: string) {
    const { riderProfile } = await this.getRiderFromToken(token);
    return {
      bankName: riderProfile.bankName || '',
      accountName: riderProfile.accountName || '',
      accountNo: riderProfile.accountNo || '',
      accountBranch: riderProfile.accountBranch || '',
    };
  }

  /** PATCH /riders/me/bank?token=xxx */
  @Patch('me/bank')
  @ApiOperation({ summary: 'Update rider bank payout details' })
  async updateBankDetails(
    @Query('token') token: string,
    @Body() body: {
      bankName: string;
      accountName: string;
      accountNo: string;
      accountBranch: string;
    },
  ) {
    const { riderProfile } = await this.getRiderFromToken(token);
    await this.prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        bankName: body.bankName,
        accountName: body.accountName,
        accountNo: body.accountNo,
        accountBranch: body.accountBranch,
      },
    });
    return { success: true };
  }

  // ─── NOTIFICATIONS ───────────────────────────────────────

  /** GET /riders/me/notifications?token=xxx */
  @Get('me/notifications')
  @ApiOperation({ summary: 'Get rider notifications' })
  async getNotifications(@Query('token') token: string) {
    const { user } = await this.getRiderFromToken(token);

    // Return recent orders as notifications
    const recentOrders = await this.prisma.order.findMany({
      where: { ...({ riderId: user.id } as any) },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return recentOrders.map((o) => ({
      id: o.id,
      title: `Order ${o.id.slice(-6).toUpperCase()}`,
      message: `Status: ${o.status} — Rs. ${Number(o.totalAmount).toFixed(2)}`,
      type: o.status === 'delivered' ? 'success' : 'info',
      createdAt: o.createdAt,
      read: false,
    }));
  }

  // ─── Helpers ─────────────────────────────────────────────

  private formatRiderResponse(user: any, riderProfile: any) {
    const profile = {
      id: riderProfile?.id,
      userId: user.id,
      vehicleType: riderProfile?.vehicleType || '',
      vehicleNumber: riderProfile?.vehicleNumber || '',
      vehicleModel: riderProfile?.vehicleModel || '',
      licenseNumber: riderProfile?.licenseNumber || '',
      status: riderProfile?.status || 'PENDING',
      isApproved: riderProfile?.isApproved || false,
      bankName: riderProfile?.bankName || '',
      accountName: riderProfile?.accountName || '',
      accountNo: riderProfile?.accountNo || '',
      accountBranch: riderProfile?.accountBranch || '',
      currentLatitude: riderProfile?.currentLatitude,
      currentLongitude: riderProfile?.currentLongitude,
      phone: riderProfile?.phone || '',
      address: riderProfile?.address || '',
      city: riderProfile?.city || '',
      nicNumber: riderProfile?.nicNumber || '',
      profilePhotoUrl: riderProfile?.profilePhotoUrl || '',
      createdAt: riderProfile?.createdAt,
    };

    return {
      // Top-level user fields
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      role: user.role,
      accessToken: 'rider-token-' + user.id,
      token: 'rider-token-' + user.id,
      // Nested rider profile (for backward compatibility)
      rider: {
        ...profile,
        // Also expose user-level fields here so frontend can read from res.rider
        email: user.email,
        fullName: user.fullName || '',
      },
    };
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: '#YR-' + order.id.slice(-6).toUpperCase(),
      status: order.status,
      totalAmount: Number(order.totalAmount),
      riderId: order.riderId,
      items: order.items || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
