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

  // ─── AUTH ────────────────────────────────────────────────

  /** POST /riders/login — login by mobile+password or OTP */
  @Post('login')
  @ApiOperation({ summary: 'Rider login with mobile/email and password' })
  async login(@Body() body: { mobile?: string; email?: string; password: string }) {
    const identifier = body.mobile || body.email || '';
    const user = await this.authService['findUserByPhoneOrEmail'](identifier);

    if (!user) throw new Error('Rider account not found');
    if (user.role !== 'RIDER') throw new Error('This account is not a rider account');

    const valid = await bcrypt.compare(body.password, user.password || '');
    if (!valid) throw new Error('Invalid password');

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { customerProfile: true, shopProfile: true, riderProfile: true },
    });

    return this.authService['formatUserAuthResponse'](fullUser, 'dev-token-' + user.id);
  }

  /** POST /riders/send-otp */
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to rider mobile' })
  async sendOtp(@Body() body: { mobile: string }) {
    return this.authService.sendOtp({ phoneNumber: body.mobile });
  }

  /** POST /riders/verify-otp */
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for rider' })
  async verifyOtp(@Body() body: { mobile: string; otp: string }) {
    return this.authService.verifyOtp({ target: body.mobile, code: body.otp });
  }

  /** POST /riders/register — register new rider account */
  @Post('register')
  @ApiOperation({ summary: 'Register a new rider account' })
  async register(@Body() body: any) {
    return this.authService.register({ ...body, role: 'RIDER' });
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

    // Update user fullName if provided
    if (body.fullName) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { fullName: body.fullName },
      });
    }

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
        riderId: user.id,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.formatOrder(o));
  }

  /** GET /riders/orders/available?token=xxx — all pending orders (new requests) */
  @Get('orders/available')
  @ApiOperation({ summary: 'Get available orders for bidding' })
  async getAvailableOrders(@Query('token') token: string) {
    await this.getRiderFromToken(token); // auth check

    const orders = await this.prisma.order.findMany({
      where: { status: 'pending', riderId: null },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return orders.map((o) => this.formatOrder(o));
  }

  /** PATCH /riders/orders/:orderId/accept?token=xxx */
  @Patch('orders/:orderId/accept')
  @ApiOperation({ summary: 'Accept a direct order' })
  async acceptOrder(
    @Param('orderId') orderId: string,
    @Query('token') token: string,
  ) {
    const { user } = await this.getRiderFromToken(token);

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { riderId: user.id, status: 'processing' as any },
      include: { items: true },
    });

    return this.formatOrder(order);
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
        riderId: user.id,
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
      where: { riderId: user.id },
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
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      role: user.role,
      accessToken: 'dev-token-' + user.id,
      rider: {
        id: riderProfile.id,
        vehicleType: riderProfile.vehicleType,
        vehicleNumber: riderProfile.vehicleNumber,
        vehicleModel: riderProfile.vehicleModel || '',
        licenseNumber: riderProfile.licenseNumber,
        status: riderProfile.status,
        isApproved: riderProfile.isApproved,
        bankName: riderProfile.bankName || '',
        accountName: riderProfile.accountName || '',
        accountNo: riderProfile.accountNo || '',
        accountBranch: riderProfile.accountBranch || '',
        currentLatitude: riderProfile.currentLatitude,
        currentLongitude: riderProfile.currentLongitude,
        createdAt: riderProfile.createdAt,
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
