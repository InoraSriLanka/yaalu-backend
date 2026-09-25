import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Headers,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@app/common';
import * as bcrypt from 'bcrypt';

@ApiTags('Riders')
@Controller('riders')
export class RidersProxyController {
  constructor(private readonly prisma: PrismaService) {}

  private extractUserIdFromToken(authHeader?: string, tokenQuery?: string): string | null {
    const rawToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : tokenQuery;
    if (!rawToken) return null;
    if (rawToken.startsWith('dev-token-')) return rawToken.replace('dev-token-', '');
    if (rawToken.startsWith('admin-token-')) return rawToken.replace('admin-token-', '');
    if (rawToken.startsWith('rider-token-')) return rawToken.replace('rider-token-', '');
    if (rawToken.startsWith('local-jwt-token-') || rawToken.startsWith('local-reg-jwt-')) return null;
    return null;
  }

  private formatRiderResponse(user: any, riderProfile: any, token?: string) {
    const fullName =
      riderProfile?.fullName ||
      user?.fullName ||
      (user?.email ? user.email.split('@')[0] : 'Rider Partner');
    const phone = riderProfile?.phoneNumber || user?.phoneNumber || user?.mobile || user?.email || '';

    const vehiclePhoto =
      riderProfile?.vehiclePhoto ||
      riderProfile?.vehiclePhotoUrl ||
      user?.vehiclePhoto ||
      user?.vehiclePhotoUrl ||
      user?.vehicle_photo ||
      '';

    const registrationDoc =
      riderProfile?.registrationDoc ||
      riderProfile?.registrationDocUrl ||
      user?.registrationDoc ||
      user?.registrationDocUrl ||
      user?.registration_doc ||
      '';

    const formattedRider = {
      id: riderProfile?.id || user?.id,
      userId: user?.id,
      fullName,
      firstName: fullName.split(' ')[0] || '',
      lastName: fullName.split(' ').slice(1).join(' ') || '',
      phone,
      mobile: phone,
      email: user?.email || '',
      nicNumber: riderProfile?.nicNumber || user?.nicNumber || '',
      profilePhotoUrl: riderProfile?.profilePhotoUrl || user?.profilePicture || user?.profilePhotoUrl || '',
      profilePicture: riderProfile?.profilePhotoUrl || user?.profilePicture || user?.profilePhotoUrl || '',
      address: riderProfile?.address || user?.address || '',
      city: riderProfile?.city || user?.city || '',
      vehicleType: riderProfile?.vehicleType || user?.vehicleType || 'MOTORBIKE',
      vehicleNumber: riderProfile?.vehicleNumber || user?.plateNumber || user?.vehicleNumber || '',
      plateNumber: riderProfile?.vehicleNumber || user?.plateNumber || user?.vehicleNumber || '',
      vehicleModel: riderProfile?.vehicleModel || user?.vehicleModel || '',
      vehiclePhoto,
      vehiclePhotoUrl: vehiclePhoto,
      registrationDoc,
      registrationDocUrl: registrationDoc,
      licenseNumber: riderProfile?.licenseNumber || user?.licenseNumber || '',
      licenseExpiry: riderProfile?.licenseExpiry || user?.licenseExpiry || '',
      licenseFrontUrl: riderProfile?.licenseFrontUrl || user?.licenseFrontUrl || '',
      licenseBackUrl: riderProfile?.licenseBackUrl || user?.licenseBackUrl || '',
      bankName: riderProfile?.bankName || user?.bankName || '',
      accountName: riderProfile?.accountName || user?.accountName || '',
      accountNumber: riderProfile?.accountNo || user?.accountNo || '',
      accountNo: riderProfile?.accountNo || user?.accountNo || '',
      branchCode: riderProfile?.accountBranch || user?.accountBranch || '',
      accountBranch: riderProfile?.accountBranch || user?.accountBranch || '',
      status: riderProfile?.status || 'PENDING',
      isApproved: riderProfile?.isApproved || false,
      deliveriesCompleted: riderProfile?.deliveriesCompleted || 0,
      rating: riderProfile?.rating || 5.0,
      currentLatitude: riderProfile?.currentLatitude,
      currentLongitude: riderProfile?.currentLongitude,
    };

    const accessToken = token || `rider-token-${user?.id || riderProfile?.id}`;

    return {
      accessToken,
      token: accessToken,
      access_token: accessToken,
      rider: formattedRider,
      user: {
        ...(user || {}),
        id: user?.id,
        email: user?.email,
        fullName,
        role: 'RIDER',
        vehiclePhoto,
        vehiclePhotoUrl: vehiclePhoto,
        registrationDoc,
        registrationDocUrl: registrationDoc,
        vehicleType: formattedRider.vehicleType,
        vehicleModel: formattedRider.vehicleModel,
        vehicleNumber: formattedRider.vehicleNumber,
        plateNumber: formattedRider.plateNumber,
      },
    };
  }

  // ─── Step 1: Personal Details ──────────────────────────────
  @Post('register/step1')
  @ApiOperation({ summary: 'Save Rider Step 1 Personal Details' })
  async registerStep1(@Body() body: any) {
    const phone = (body.phone || body.mobile || '').trim();
    const fullName =
      body.fullName ||
      `${body.firstName || ''} ${body.lastName || ''}`.trim() ||
      'Rider Partner';
    const providedEmail = body.email ? body.email.trim().toLowerCase() : null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultEmail = cleanPhone ? `${cleanPhone}@rider.yaalu.lk` : `${Date.now()}@rider.yaalu.lk`;
    const email = providedEmail || defaultEmail;

    // Check if user already exists with this phone or email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(providedEmail ? [{ email: providedEmail }] : []),
          ...(phone ? [{ riderProfile: { phoneNumber: phone } }] : []),
          { email: defaultEmail },
        ],
      },
      include: { riderProfile: true },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('Temporary@123', 10);
      user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          role: 'RIDER',
          password: hashedPassword,
        },
        include: { riderProfile: true },
      });
    } else {
      const updateData: any = { fullName };
      if (providedEmail && providedEmail !== user.email) {
        updateData.email = providedEmail;
      }
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { riderProfile: true },
      });
    }

    const riderProfile = await this.prisma.riderProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName,
        phoneNumber: phone,
        nicNumber: body.nicNumber || body.nic || '',
        profilePhotoUrl: body.profilePhotoUrl || '',
        vehicleType: 'MOTORBIKE',
        vehicleNumber: '',
        licenseNumber: '',
        status: 'PENDING',
        isApproved: false,
      },
      update: {
        fullName,
        phoneNumber: phone || undefined,
        nicNumber: body.nicNumber || body.nic || undefined,
        profilePhotoUrl: body.profilePhotoUrl || undefined,
      },
    });

    return this.formatRiderResponse(user, riderProfile);
  }

  // ─── Step 2: Contact & Address ─────────────────────────────
  @Post('register/step2')
  @ApiOperation({ summary: 'Save Rider Step 2 Contact & Address' })
  async registerStep2(@Body() body: any) {
    const phone = (body.phone || body.mobile || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ riderProfile: { phoneNumber: phone } }] : []),
          ...(cleanPhone ? [{ email: `${cleanPhone}@rider.yaalu.lk` }] : []),
        ],
      },
      include: { riderProfile: true },
    });

    if (user && user.riderProfile) {
      const profileId = user.riderProfile.id;
      if (email && email.includes('@') && !email.endsWith('@rider.yaalu.lk') && email !== user.email) {
        try {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { email },
            include: { riderProfile: true },
          });
        } catch (e) {
          console.warn('[Rider Register Step2] Could not update user email:', e);
        }
      }

      const updatedProfile = await this.prisma.riderProfile.update({
        where: { id: profileId },
        data: {
          address: body.address || undefined,
          city: body.city || undefined,
          ...(phone ? { phoneNumber: phone } : {}),
        },
      });
      return this.formatRiderResponse(user, updatedProfile);
    }

    return { success: true, message: 'Step 2 data recorded' };
  }

  // ─── Step 3: Vehicle Information ───────────────────────────
  @Post('register/step3')
  @ApiOperation({ summary: 'Save Rider Step 3 Vehicle Information' })
  async registerStep3(@Body() body: any) {
    const phone = (body.phone || body.mobile || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ riderProfile: { phoneNumber: phone } }] : []),
          ...(cleanPhone ? [{ email: `${cleanPhone}@rider.yaalu.lk` }] : []),
        ],
      },
      include: { riderProfile: true },
    });

    if (user && user.riderProfile) {
      const profileId = user.riderProfile.id;
      if (email && email.includes('@') && !email.endsWith('@rider.yaalu.lk') && email !== user.email) {
        try {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { email },
            include: { riderProfile: true },
          });
        } catch (e) {
          console.warn('[Rider Register Step3] Could not update user email:', e);
        }
      }

      const updatedProfile = await this.prisma.riderProfile.update({
        where: { id: profileId },
        data: {
          vehicleType: body.vehicleType || 'MOTORBIKE',
          vehicleNumber: body.vehicleNumber || body.plateNumber || '',
          vehicleModel: body.vehicleModel || '',
        },
      });
      return this.formatRiderResponse(user, updatedProfile);
    }

    return { success: true, message: 'Step 3 data recorded' };
  }

  // ─── Step 4: Driving License ───────────────────────────────
  @Post('register/step4')
  @ApiOperation({ summary: 'Save Rider Step 4 Driving License' })
  async registerStep4(@Body() body: any) {
    const phone = (body.phone || body.mobile || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ riderProfile: { phoneNumber: phone } }] : []),
          ...(cleanPhone ? [{ email: `${cleanPhone}@rider.yaalu.lk` }] : []),
        ],
      },
      include: { riderProfile: true },
    });

    if (user && user.riderProfile) {
      const profileId = user.riderProfile.id;
      if (email && email.includes('@') && !email.endsWith('@rider.yaalu.lk') && email !== user.email) {
        try {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { email },
            include: { riderProfile: true },
          });
        } catch (e) {
          console.warn('[Rider Register Step4] Could not update user email:', e);
        }
      }

      const updatedProfile = await this.prisma.riderProfile.update({
        where: { id: profileId },
        data: {
          licenseNumber: body.licenseNumber || '',
          licenseExpiry: body.licenseExpiry || '',
          licenseFrontUrl: body.licenseFrontUrl || '',
          licenseBackUrl: body.licenseBackUrl || '',
        },
      });
      return this.formatRiderResponse(user, updatedProfile);
    }

    return { success: true, message: 'Step 4 data recorded' };
  }

  // ─── Step 5 & Final Complete Registration ──────────────────
  @Post('register/step5')
  @ApiOperation({ summary: 'Save Rider Step 5 Banking & Complete Registration' })
  async registerStep5(@Body() body: any) {
    return this.completeRegistration(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'All-in-one Rider Registration' })
  async register(@Body() body: any) {
    return this.completeRegistration(body);
  }

  private async completeRegistration(body: any) {
    const phone = (body.phone || body.mobile || body.phoneNumber || '').trim();
    const fullName =
      body.fullName ||
      `${body.firstName || ''} ${body.lastName || ''}`.trim() ||
      'Rider Partner';
    const providedEmail = body.email ? body.email.trim().toLowerCase() : null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultEmail = cleanPhone ? `${cleanPhone}@rider.yaalu.lk` : `${Date.now()}@rider.yaalu.lk`;
    const email = providedEmail || defaultEmail;

    const passwordToHash = body.password || 'Temporary@123';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Find existing user or create
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(providedEmail ? [{ email: providedEmail }] : []),
          ...(phone ? [{ riderProfile: { phoneNumber: phone } }] : []),
          { email: defaultEmail },
        ],
      },
      include: { riderProfile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          role: 'RIDER',
          password: hashedPassword,
        },
        include: { riderProfile: true },
      });
    } else {
      const emailToSet = (providedEmail && providedEmail.includes('@') && !providedEmail.endsWith('@rider.yaalu.lk'))
        ? providedEmail
        : user.email;

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: emailToSet,
          fullName,
          password: hashedPassword,
          role: 'RIDER',
        },
        include: { riderProfile: true },
      });
    }

    // Upsert full rider profile with all 5 steps of data
    const riderProfile = await this.prisma.riderProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName,
        phoneNumber: phone,
        nicNumber: body.nicNumber || body.nic || '',
        profilePhotoUrl: body.profilePhotoUrl || '',
        address: body.address || '',
        city: body.city || '',
        vehicleType: body.vehicleType || 'MOTORBIKE',
        vehicleNumber: body.vehicleNumber || body.plateNumber || 'WP REG-0000',
        vehicleModel: body.vehicleModel || '',
        licenseNumber: body.licenseNumber || 'LIC-00000',
        licenseExpiry: body.licenseExpiry || '',
        licenseFrontUrl: body.licenseFrontUrl || '',
        licenseBackUrl: body.licenseBackUrl || '',
        bankName: body.bankName || 'Commercial Bank',
        accountName: body.accountHolder || body.accountName || fullName,
        accountNo: body.accountNumber || body.accountNo || '',
        accountBranch: body.branchCode || body.accountBranch || '',
        status: 'AVAILABLE',
        isApproved: true,
      },
      update: {
        fullName,
        phoneNumber: phone || undefined,
        nicNumber: body.nicNumber || body.nic || undefined,
        profilePhotoUrl: body.profilePhotoUrl || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        vehicleType: body.vehicleType || undefined,
        vehicleNumber: body.vehicleNumber || body.plateNumber || undefined,
        vehicleModel: body.vehicleModel || undefined,
        licenseNumber: body.licenseNumber || undefined,
        licenseExpiry: body.licenseExpiry || undefined,
        licenseFrontUrl: body.licenseFrontUrl || undefined,
        licenseBackUrl: body.licenseBackUrl || undefined,
        bankName: body.bankName || undefined,
        accountName: body.accountHolder || body.accountName || undefined,
        accountNo: body.accountNumber || body.accountNo || undefined,
        accountBranch: body.branchCode || body.accountBranch || undefined,
        status: 'AVAILABLE',
        isApproved: true,
      },
    });

    return this.formatRiderResponse(user, riderProfile);
  }

  // ─── Registration Status ───────────────────────────────────
  @Get('register/status')
  @ApiOperation({ summary: 'Check rider registration status' })
  async getRegistrationStatus(@Query('phone') phoneQuery: string) {
    if (!phoneQuery) return { isRegistered: false };
    const phone = phoneQuery.trim();

    const rider = await this.prisma.riderProfile.findFirst({
      where: {
        OR: [
          { phoneNumber: phone },
          { user: { email: `${phone.replace(/[^0-9]/g, '')}@rider.yaalu.lk` } },
        ],
      },
      include: { user: true },
    });

    if (!rider) return { isRegistered: false };
    return {
      isRegistered: true,
      status: rider.status,
      isApproved: rider.isApproved,
      rider: {
        id: rider.id,
        fullName: rider.fullName,
        phone: rider.phoneNumber,
        status: rider.status,
        isApproved: rider.isApproved,
      },
    };
  }

  // ─── Rider Login ───────────────────────────────────────────
  @Post('login')
  @ApiOperation({ summary: 'Rider login with mobile/email & password' })
  async riderLogin(@Body() body: { mobile?: string; email?: string; password?: string }) {
    const identifier = (body.mobile || body.email || '').trim();
    if (!identifier) {
      throw new BadRequestException('Mobile number or email is required');
    }
    if (!body.password) {
      throw new BadRequestException('Password is required');
    }

    const cleanDigits = identifier.replace(/[^0-9]/g, '');
    const coreNumber = cleanDigits.length >= 9 ? cleanDigits.slice(-9) : cleanDigits;

    const phoneVariations = Array.from(
      new Set([
        identifier,
        cleanDigits,
        coreNumber,
        `+94${coreNumber}`,
        `0${coreNumber}`,
        `94${coreNumber}`,
      ]),
    ).filter(Boolean);

    const emailVariations = Array.from(
      new Set([
        identifier.toLowerCase(),
        ...phoneVariations.map((p) => `${p}@rider.yaalu.lk`),
      ]),
    ).filter(Boolean);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { in: emailVariations } },
          { riderProfile: { phoneNumber: { in: phoneVariations } } },
        ],
      },
      include: { riderProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Account not found. Please check your mobile number or email.');
    }

    if (!user.password) {
      throw new UnauthorizedException('No password set for this account. Please verify via OTP or reset password.');
    }

    const valid = await bcrypt.compare(body.password, user.password).catch(() => false);
    if (!valid) {
      throw new UnauthorizedException('Incorrect password. Please enter your correct password.');
    }

    return this.formatRiderResponse(user, user.riderProfile);
  }

  // ─── OTP Endpoints ─────────────────────────────────────────
  @Post('send-otp')
  async sendOtp(@Body() body: { mobile?: string; phone?: string }) {
    const mobile = body.mobile || body.phone || '+94771234567';
    return {
      success: true,
      message: 'OTP sent (Demo code: 123456)',
      otp: '123456',
      phone: mobile,
      mobile,
    };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { mobile?: string; otp?: string }) {
    const mobile = body.mobile || '+94771234567';
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { riderProfile: { phoneNumber: mobile } },
          { email: `${mobile.replace(/[^0-9]/g, '')}@rider.yaalu.lk` },
        ],
      },
      include: { riderProfile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: `${mobile.replace(/[^0-9]/g, '')}@rider.yaalu.lk`,
          fullName: 'Rider Partner',
          role: 'RIDER',
          riderProfile: {
            create: {
              fullName: 'Rider Partner',
              phoneNumber: mobile,
              vehicleType: 'MOTORBIKE',
              vehicleNumber: 'WP BCD-1234',
              licenseNumber: 'B1234567',
              status: 'AVAILABLE',
              isApproved: true,
            },
          },
        },
        include: { riderProfile: true },
      });
    }

    return this.formatRiderResponse(user, user.riderProfile);
  }

  // ─── Rider Profile (Me) ────────────────────────────────────
  @Get('me')
  async getMyProfile(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);

    let riderProfile: any = null;
    let user: any = null;

    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { riderProfile: true },
      });
      riderProfile = user?.riderProfile;

      try {
        const rawUsers: any[] = await this.prisma.$queryRaw`SELECT * FROM public.users WHERE id = ${userId} LIMIT 1`;
        if (rawUsers && rawUsers.length > 0) {
          user = { ...rawUsers[0], ...(user || {}) };
        }
      } catch (e) {
        console.warn('[Rider me raw query]:', e);
      }
    }

    if (!riderProfile) {
      riderProfile = await this.prisma.riderProfile.findFirst({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      user = riderProfile?.user;
      if (user?.id) {
        try {
          const rawUsers: any[] = await this.prisma.$queryRaw`SELECT * FROM public.users WHERE id = ${user.id} LIMIT 1`;
          if (rawUsers && rawUsers.length > 0) {
            user = { ...rawUsers[0], ...(user || {}) };
          }
        } catch (e) {}
      }
    }

    if (!riderProfile) {
      return {
        rider: {
          id: 'rider-default',
          fullName: 'Kasun Perera',
          phone: '+94 77 123 4567',
          status: 'AVAILABLE',
          isApproved: true,
          vehicleType: 'MOTORBIKE',
          vehicleNumber: 'WP BCD-1234',
          rating: 4.9,
          deliveriesCompleted: 142,
        },
      };
    }

    return this.formatRiderResponse(user, riderProfile);
  }

  @Patch('me')
  async updateMyProfile(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
    let rider = await this.prisma.riderProfile.findFirst({
      where: userId ? { userId } : {},
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (rider) {
      const updated = await this.prisma.riderProfile.update({
        where: { id: rider.id },
        data: {
          fullName: body.fullName || undefined,
          phoneNumber: body.phone || body.mobile || body.phoneNumber || undefined,
          address: body.address || undefined,
          city: body.city || undefined,
          vehicleType: body.vehicleType || undefined,
          vehicleNumber: body.vehicleNumber || undefined,
          vehicleModel: body.vehicleModel || undefined,
        },
        include: { user: true },
      });
      return this.formatRiderResponse(updated.user, updated);
    }

    return { success: true };
  }

  @Patch('me/status')
  async updateMyStatus(
    @Body() body: { status: string },
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
    const rider = await this.prisma.riderProfile.findFirst({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });

    if (rider) {
      const updated = await this.prisma.riderProfile.update({
        where: { id: rider.id },
        data: { status: body.status as any },
      });
      return { success: true, status: updated.status };
    }

    return { success: true, status: body.status };
  }

  @Patch('me/location')
  async updateMyLocation(
    @Body() body: { latitude: number; longitude: number },
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
    const rider = await this.prisma.riderProfile.findFirst({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });

    if (rider) {
      await this.prisma.riderProfile.update({
        where: { id: rider.id },
        data: {
          currentLatitude: body.latitude,
          currentLongitude: body.longitude,
        },
      });
    }

    return { success: true };
  }

  // ─── Bank Details ──────────────────────────────────────────
  @Get('me/bank')
  async getMyBankDetails(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
    const rider = await this.prisma.riderProfile.findFirst({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });

    return {
      bankName: rider?.bankName || 'Commercial Bank',
      accountHolder: rider?.accountName || rider?.fullName || 'Rider Partner',
      accountName: rider?.accountName || rider?.fullName || 'Rider Partner',
      accountNumber: rider?.accountNo || '8001234567',
      accountNo: rider?.accountNo || '8001234567',
      branchCode: rider?.accountBranch || '054 (Colombo Fort)',
      accountBranch: rider?.accountBranch || 'Colombo Fort',
    };
  }

  @Patch('me/bank')
  async updateMyBankDetails(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
    const rider = await this.prisma.riderProfile.findFirst({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });

    if (rider) {
      const updated = await this.prisma.riderProfile.update({
        where: { id: rider.id },
        data: {
          bankName: body.bankName || undefined,
          accountName: body.accountHolder || body.accountName || undefined,
          accountNo: body.accountNumber || body.accountNo || undefined,
          accountBranch: body.branchCode || body.accountBranch || undefined,
        },
      });
      return {
        success: true,
        bankName: updated.bankName,
        accountName: updated.accountName,
        accountNo: updated.accountNo,
        accountBranch: updated.accountBranch,
      };
    }

    return { success: true, ...body };
  }

  // ─── Orders & Earnings ─────────────────────────────────────
  @Get('orders/available')
  async getAvailableOrders() {
    try {
      // 1. Fetch unaccepted ride requests from database
      const rides = await this.prisma.rideRequest.findMany({
        where: {
          status: { in: ['SEARCHING', 'BIDDING_ACTIVE'] },
          acceptedDriverId: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      // 2. Fetch pending product delivery orders
      const storeOrders = await this.prisma.order.findMany({
        where: {
          status: 'pending',
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });

      const formattedRides = rides.map((r) => ({
        id: r.id,
        orderNumber: `RID-${r.id.slice(0, 6).toUpperCase()}`,
        pickupAddress: r.pickupAddress || 'Pickup Location',
        dropoffAddress: r.dropoffAddress || 'Delivery Location',
        deliveryAddress: r.dropoffAddress || 'Delivery Location',
        distanceKm: 3.5,
        fare: Number(r.finalFare) || 500,
        estimatedTime: '15 mins',
        rideType: r.rideType || 'STANDARD',
        merchantName: r.tripCategory || 'Customer Request',
        itemsCount: 1,
        status: r.status,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));

      const formattedOrders = storeOrders.map((o) => ({
        id: o.id,
        orderNumber: `ORD-${o.id.slice(0, 6).toUpperCase()}`,
        pickupAddress: 'Yaalu Express Central Warehouse',
        dropoffAddress: o.notes || 'Customer Delivery Address',
        deliveryAddress: o.notes || 'Customer Delivery Address',
        distanceKm: 4.2,
        fare: Number(o.totalAmount) || 600,
        estimatedTime: '20 mins',
        rideType: 'STANDARD',
        merchantName: o.merchantId !== 'default' ? o.merchantId : 'Store Purchase',
        itemsCount: o.items ? o.items.length : 1,
        status: o.status,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      }));

      return [...formattedRides, ...formattedOrders];
    } catch (error) {
      console.warn('[Rider Proxy getAvailableOrders Error]:', error);
      return [];
    }
  }

  @Get('me/orders')
  async getMyOrders(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
    @Query('status') statusFilter?: string,
  ) {
    try {
      const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
      const rider = await this.prisma.riderProfile.findFirst({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
      });

      const riderId = userId || rider?.userId || rider?.id;

      let rides: any[] = [];
      let hires: any[] = [];

      if (riderId) {
        rides = await this.prisma.rideRequest.findMany({
          where: {
            OR: [
              { acceptedDriverId: riderId },
              ...(rider?.id ? [{ acceptedDriverId: rider.id }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        hires = await this.prisma.hire.findMany({
          where: {
            OR: [
              { riderId: riderId },
              ...(rider?.id ? [{ riderId: rider.id }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const formattedRides = rides.map((r) => {
        const fareNum = Number(r.finalFare) || 0;
        return {
          id: r.id,
          orderNumber: `RID-${r.id.slice(0, 6).toUpperCase()}`,
          status: r.status === 'COMPLETED' ? 'COMPLETED' : r.status,
          pickupAddress: r.pickupAddress,
          dropoffAddress: r.dropoffAddress,
          deliveryAddress: r.dropoffAddress,
          fare: fareNum,
          amount: `LKR ${fareNum.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
          tip: 0,
          totalEarnings: fareNum,
          completedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date(r.createdAt).toISOString(),
          dateGroup: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          customerName: 'Customer',
        };
      });

      const formattedHires = hires.map((h) => {
        const feeNum = Number(h.fee) || 0;
        return {
          id: h.id,
          orderNumber: `HIR-${h.id.slice(0, 6).toUpperCase()}`,
          status: 'COMPLETED',
          pickupAddress: 'Customer Pickup',
          dropoffAddress: 'Customer Dropoff',
          deliveryAddress: 'Customer Dropoff',
          fare: feeNum,
          amount: `LKR ${feeNum.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
          tip: 0,
          totalEarnings: feeNum,
          completedAt: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
          dateGroup: new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          customerName: h.customerName || 'Customer',
        };
      });

      const combined = [...formattedRides, ...formattedHires];

      if (statusFilter && statusFilter !== 'All') {
        const cleanFilter = statusFilter.toUpperCase();
        return combined.filter((item) => {
          if (cleanFilter === 'COMPLETED') return item.status === 'COMPLETED' || item.status === 'DELIVERED';
          if (cleanFilter === 'PENDING') return item.status === 'PENDING' || item.status === 'ACCEPTED' || item.status === 'IN_TRIP';
          if (cleanFilter === 'CANCELLED') return item.status === 'CANCELLED';
          return true;
        });
      }

      return combined;
    } catch (error) {
      console.warn('[Rider Proxy getMyOrders Error]:', error);
      return [];
    }
  }

  @Patch('orders/:orderId/accept')
  async acceptOrder(
    @Param('orderId') orderId: string,
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
    const rider = await this.prisma.riderProfile.findFirst({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });
    const activeDriverId = userId || rider?.userId || rider?.id || 'rider-partner-1';

    // Check if ride request exists
    const existingRide = await this.prisma.rideRequest.findUnique({
      where: { id: orderId },
    });

    if (existingRide) {
      if (existingRide.acceptedDriverId && existingRide.acceptedDriverId !== activeDriverId) {
        throw new ConflictException('This request has already been accepted by another rider!');
      }

      const updatedRide = await this.prisma.rideRequest.update({
        where: { id: orderId },
        data: {
          status: 'ACCEPTED',
          acceptedDriverId: activeDriverId,
        },
      });

      return {
        success: true,
        message: 'Ride request accepted successfully',
        orderId: updatedRide.id,
        status: updatedRide.status,
      };
    }

    // Check if store order exists
    const existingStoreOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (existingStoreOrder) {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'processing',
        },
      });

      return {
        success: true,
        message: 'Order accepted successfully',
        orderId: updatedOrder.id,
        status: 'ACCEPTED',
      };
    }

    return {
      success: true,
      message: `Order ${orderId} accepted successfully`,
      orderId,
      status: 'ACCEPTED',
    };
  }

  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    try {
      const existingRide = await this.prisma.rideRequest.findUnique({ where: { id: orderId } });
      if (existingRide) {
        await this.prisma.rideRequest.update({
          where: { id: orderId },
          data: { status: body.status as any },
        });
      }
    } catch (e) {}

    return {
      success: true,
      orderId,
      status: body.status,
    };
  }

  @Get('me/earnings')
  async getEarnings(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
    @Query('period') period = 'daily',
  ) {
    try {
      const userId = this.extractUserIdFromToken(authHeader, tokenQuery);
      const rider = await this.prisma.riderProfile.findFirst({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
      });
      const riderId = userId || rider?.userId || rider?.id;

      let completedRides: any[] = [];
      let completedHires: any[] = [];

      if (riderId) {
        completedRides = await this.prisma.rideRequest.findMany({
          where: {
            OR: [
              { acceptedDriverId: riderId },
              ...(rider?.id ? [{ acceptedDriverId: rider.id }] : []),
            ],
            status: 'COMPLETED',
          },
        });

        completedHires = await this.prisma.hire.findMany({
          where: {
            OR: [
              { riderId: riderId },
              ...(rider?.id ? [{ riderId: rider.id }] : []),
            ],
          },
        });
      }

      const rideEarnings = completedRides.reduce((sum, r) => sum + (Number(r.finalFare) || 0), 0);
      const hireEarnings = completedHires.reduce((sum, h) => sum + (Number(h.fee) || 0), 0);
      const totalEarnings = rideEarnings + hireEarnings;
      const totalDeliveries = completedRides.length + completedHires.length;

      return {
        period,
        totalEarnings,
        todayEarnings: totalEarnings,
        totalDeliveries,
        completedTrips: totalDeliveries,
        tipsEarned: 0,
        incentives: 0,
        onlineHours: totalDeliveries > 0 ? (totalDeliveries * 0.5) : 0,
      };
    } catch (e) {
      return {
        period,
        totalEarnings: 0,
        todayEarnings: 0,
        totalDeliveries: 0,
        completedTrips: 0,
        tipsEarned: 0,
        incentives: 0,
        onlineHours: 0,
      };
    }
  }

  @Get('me/notifications')
  async getNotifications() {
    try {
      // 1. Fetch live unaccepted ride requests to populate request notifications
      const activeRides = await this.prisma.rideRequest.findMany({
        where: {
          status: { in: ['SEARCHING', 'BIDDING_ACTIVE'] },
          acceptedDriverId: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      const requestNotifs = activeRides.map((r) => ({
        id: `notif-ride-${r.id}`,
        title: r.rideType === 'BIDDING' ? '🚗 New Bidding Ride Request!' : '⚡ New Delivery Trip Available!',
        description: `Pickup: ${r.pickupAddress} → Dropoff: ${r.dropoffAddress} (Fare: LKR ${Number(r.finalFare || 0).toFixed(2)})`,
        time: 'Just now',
        type: 'Requests',
        iconName: 'car-outline',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        isRead: false,
      }));

      const systemNotifs = [
        {
          id: 'notif-system-1',
          title: 'Payout System Active 💰',
          description: 'Your weekly payout account is ready. Earned delivery fares are added to your balance.',
          time: 'Today',
          type: 'Alerts',
          iconName: 'wallet-outline',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          isRead: true,
        },
        {
          id: 'notif-system-2',
          title: 'High Demand Zone Alert 🚀',
          description: 'High order volume in Colombo & Suburbs. Turn on Online status to receive orders!',
          time: 'Yesterday',
          type: 'Alerts',
          iconName: 'flame-outline',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          isRead: true,
        },
      ];

      return [...requestNotifs, ...systemNotifs];
    } catch (e) {
      console.warn('[Rider Proxy getNotifications Error]:', e);
      return [];
    }
  }
}
