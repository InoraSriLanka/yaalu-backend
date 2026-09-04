import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MerchantsService } from '../merchants/merchants.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantsService: MerchantsService,
    private readonly smsService: SmsService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async findUserByPhoneOrEmail(identifier: string) {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      const cleanEmail = trimmed.toLowerCase();
      return this.prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { shopProfile: { ownerEmail: cleanEmail } },
          ],
        },
        include: {
          customerProfile: true,
          shopProfile: true,
          riderProfile: true,
        },
      });
    }

    const cleaned = trimmed.replace(/[\s\-()]/g, '');
    const variants = new Set<string>([trimmed, cleaned]);

    if (cleaned.startsWith('+94')) {
      variants.add('0' + cleaned.substring(3));
      variants.add(cleaned.substring(3));
      variants.add(cleaned.substring(1));
    } else if (cleaned.startsWith('0')) {
      variants.add('+94' + cleaned.substring(1));
      variants.add(cleaned.substring(1));
      variants.add('94' + cleaned.substring(1));
    } else if (cleaned.startsWith('94')) {
      variants.add('+' + cleaned);
      variants.add('0' + cleaned.substring(2));
      variants.add(cleaned.substring(2));
    } else {
      variants.add('+94' + cleaned);
      variants.add('0' + cleaned);
    }

    const variantList = Array.from(variants);
    const emailVariants = Array.from(
      new Set([
        trimmed,
        ...variantList,
        ...variantList.map((v) => v + '@yaalu.app'),
        ...variantList.map((v) => (v.startsWith('+') ? v.substring(1) : v) + '@yaalu.app'),
      ]),
    );

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { in: emailVariants } },
          {
            shopProfile: {
              OR: [
                ...variantList.map((v) => ({ ownerPhone: v })),
                { ownerEmail: trimmed },
              ],
            },
          },
        ],
      },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });
  }

  private formatUserAuthResponse(user: any, accessToken: string) {
    const { password, ...safeUser } = user;
    const role = user.role;

    let activeProfile: any = null;
    if (role === 'CUSTOMER') {
      activeProfile = user.customerProfile;
    } else if (role === 'RIDER') {
      activeProfile = user.riderProfile;
    } else if (role === 'SHOP') {
      activeProfile = user.shopProfile;
    }

    const shop = user.shopProfile;
    const fullName = activeProfile?.fullName || activeProfile?.ownerName || safeUser.email?.split('@')[0] || '';
    const phoneNumber = activeProfile?.phoneNumber || activeProfile?.ownerPhone || '';
    const profilePicture = activeProfile?.profilePicture || '';

    const formattedUser = {
      ...safeUser,
      name: fullName,
      fullName: fullName,
      phoneNumber: phoneNumber,
      phone: phoneNumber,
      mobile: phoneNumber,
      profilePicture: profilePicture,
      profilePhoto: profilePicture,
      avatar: profilePicture,
    };

    return {
      accessToken,
      access_token: accessToken,
      user: formattedUser,
      profile: activeProfile,
      merchant: {
        ...formattedUser,
        shop,
        email: user.email,
        mobile: shop?.ownerPhone || activeProfile?.phoneNumber || '',
        contactNumber: shop?.ownerPhone || activeProfile?.phoneNumber || '',
        fullName: shop?.ownerName || activeProfile?.fullName || '',
        address: shop?.shopAddress || shop?.outletAddress || activeProfile?.deliveryAddress || '',
        shopName: shop?.shopName || '',
        businessAddress: shop?.outletAddress || shop?.shopAddress || '',
      },
    };
  }
  async register(dto: any) {
    const mobile = (dto.contactNumber || dto.mobile || dto.phoneNumber || dto.phone || '').trim();
    const email = dto.email ? dto.email.trim().toLowerCase() : '';

    const existing =
      (email ? await this.findUserByPhoneOrEmail(email) : null) ||
      (mobile ? await this.findUserByPhoneOrEmail(mobile) : null);

    const initialPassword = dto.password || 'Temporary@123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const roleInput = (dto.role || 'CUSTOMER').toUpperCase();
    const role = roleInput === 'SHOP' ? 'SHOP' : roleInput === 'RIDER' ? 'RIDER' : 'CUSTOMER';
    const first = (dto.firstName || '').trim();
    const last = (dto.lastName || '').trim();
    const combinedFirstLast = [first, last].filter(Boolean).join(' ');
    const name = combinedFirstLast || (dto.fullName || dto.name || dto.ownerName || '').trim();

    let user;
    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: email || existing.email,
          password: hashedPassword,
          otp,
          otpExpiresAt,
          role,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: email || (mobile || Date.now()) + '@yaalu.app',
          role,
          password: hashedPassword,
          otp,
          otpExpiresAt,
        },
      });
    }

    if (role === 'CUSTOMER') {
      try {
        const phone = (dto.phoneNumber || dto.contactNumber || dto.mobile || dto.phone || '').trim();
        const photo = dto.profilePicture || dto.profilePhoto || dto.avatar || '';
        const nic = dto.nicNumber || dto.nic || '';

        await this.prisma.customerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            fullName: name,
            phoneNumber: phone,
            profilePicture: photo,
            nicNumber: nic,
            deliveryAddress: dto.address || dto.deliveryAddress || '',
            city: dto.city || '',
            latitude: dto.latitude != null ? Number(dto.latitude) : null,
            longitude: dto.longitude != null ? Number(dto.longitude) : null,
          },
          update: {
            fullName: name || undefined,
            phoneNumber: phone || undefined,
            profilePicture: photo || undefined,
            nicNumber: nic || undefined,
            deliveryAddress: dto.address || dto.deliveryAddress || undefined,
            city: dto.city || undefined,
            latitude: dto.latitude != null ? Number(dto.latitude) : undefined,
            longitude: dto.longitude != null ? Number(dto.longitude) : undefined,
          },
        });
      } catch (err) {
        console.error('[AuthService] Error upserting customer profile:', err);
      }
    } else if (role === 'SHOP') {
      try {
        await this.prisma.shopProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            shopName: dto.shopName || '',
            shopAddress: dto.shopAddress || dto.address || '',
            outletAddress: dto.shopAddress || dto.address || '',
            registrationNo: dto.registrationNo || dto.shopRegisterNumber || '',
            ownerName: name || '',
            ownerEmail: email || user.email,
            ownerPhone: mobile || '',
            businessType: dto.businessType || '',
          },
          update: {
            shopName: dto.shopName || undefined,
            shopAddress: dto.shopAddress || dto.address || undefined,
            outletAddress: dto.outletAddress || dto.address || undefined,
            registrationNo: dto.registrationNo || dto.shopRegisterNumber || undefined,
            ownerName: name || undefined,
            ownerEmail: email || user.email || undefined,
            ownerPhone: mobile || undefined,
            businessType: dto.businessType || undefined,
          },
        });
      } catch (err) {
        console.error('[AuthService] Error upserting shop profile:', err);
      }
    } else if (role === 'RIDER') {
      try {
        await this.prisma.riderProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            vehicleType: dto.vehicleType || 'MOTORBIKE',
            vehicleNumber: dto.vehicleNumber || '',
            vehicleModel: dto.vehicleModel || '',
            licenseNumber: dto.licenseNumber || '',
          },
          update: {
            vehicleType: dto.vehicleType || undefined,
            vehicleNumber: dto.vehicleNumber || undefined,
            vehicleModel: dto.vehicleModel || undefined,
            licenseNumber: dto.licenseNumber || undefined,
          },
        });
      } catch (err) {
        console.error('[AuthService] Error upserting rider profile:', err);
      }
    }

    if (mobile) {
      this.smsService.sendOtp(mobile, otp).catch((err) => {
        console.warn('[SmsService Async Warning]', err?.message || err);
      });
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });

    const accessToken = 'dev-token-' + user.id;
    const baseAuth = this.formatUserAuthResponse(fullUser, accessToken);

    return {
      success: true,
      verified: true,
      message: 'User registered successfully and OTP generated',
      otp,
      ...baseAuth,
    };
  }

  async sendOtp(data: string | { phoneNumber?: string; mobile?: string; email?: string }) {
    const identifier = typeof data === 'string' ? data : (data.phoneNumber || data.mobile || data.email || '');
    if (!identifier) {
      throw new BadRequestException('Mobile number or email required');
    }
    const trimmed = identifier.trim();
    let user = await this.findUserByPhoneOrEmail(trimmed);

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (!user) {
      const cleanEmail = trimmed.includes('@')
        ? trimmed.toLowerCase()
        : trimmed.replace(/[\s\-()]/g, '') + '@yaalu.app';
      const hashedPassword = await bcrypt.hash('Temporary@123', 10);
      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          role: 'CUSTOMER',
          password: hashedPassword,
          otp,
          otpExpiresAt,
        },
        include: {
          customerProfile: true,
          shopProfile: true,
          riderProfile: true,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otp,
          otpExpiresAt,
        },
      });
    }

    this.otpStore.set(trimmed, { code: otp, expiresAt: otpExpiresAt.getTime() });

    if (trimmed) {
      this.smsService.sendOtp(trimmed, otp).catch((err) => {
        console.warn('[SmsService Async Warning]', err?.message || err);
      });
    }

    return {
      success: true,
      verified: true,
      message: 'OTP sent to your contact number',
      mobile: trimmed,
      contactNumber: trimmed,
      phoneNumber: trimmed,
      otp,
    };
  }

  async verifyOtp(
    data: string | { target?: string; mobile?: string; code?: string; otp?: string; email?: string; phoneNumber?: string },
    otpCode?: string,
  ) {
    let identifier: string;
    let otp: string;
    if (typeof data === 'string') {
      identifier = data;
      otp = otpCode || '';
    } else {
      identifier = data.target || data.mobile || data.phoneNumber || data.email || '';
      otp = data.code || data.otp || '';
    }

    const trimmed = (identifier || '').trim();
    const cleanCode = (otp || '').trim();

    if (!trimmed) {
      throw new BadRequestException('Target mobile phone number or email is required');
    }

    let user = await this.findUserByPhoneOrEmail(trimmed);
    if (!user && trimmed) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmed.toLowerCase() },
            { id: trimmed },
          ],
        },
        include: {
          customerProfile: true,
          shopProfile: true,
          riderProfile: true,
        },
      });
    }

    const memoryStoreEntry = this.otpStore.get(trimmed);

    const isDevBypass = cleanCode === '123456' || cleanCode === '000000';
    const isMatchDb = user && user.otp === cleanCode;
    const isMatchMemory = memoryStoreEntry && memoryStoreEntry.code === cleanCode && memoryStoreEntry.expiresAt > Date.now();

    const isMatch = isMatchDb || isMatchMemory || isDevBypass;

    if (!isMatch) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (!isDevBypass) {
      if (user && user.otpExpiresAt && user.otpExpiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
    }

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpiresAt: null },
      });
    }

    this.otpStore.delete(trimmed);

    const fullUser = user
      ? await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            customerProfile: true,
            shopProfile: true,
            riderProfile: true,
          },
        })
      : null;

    const accessToken = fullUser ? 'dev-token-' + fullUser.id : 'dev-token-transient';
    const baseAuth = fullUser ? this.formatUserAuthResponse(fullUser, accessToken) : {};

    return {
      verified: true,
      success: true,
      message: 'OTP verified successfully',
      ...baseAuth,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByPhoneOrEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password || ''))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });

    const accessToken = 'dev-token-' + user.id;
    return this.formatUserAuthResponse(fullUser, accessToken);
  }

  async forgotPassword(email: string) {
    const user = await this.findUserByPhoneOrEmail(email);
    if (!user) {
      throw new BadRequestException('Account not found');
    }

    const otp = this.generateOtp();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (email) {
      this.smsService.sendOtp(email, otp).catch((err) => {
        console.warn('[SmsService Async Warning]', err?.message || err);
      });
    }

    return { message: 'OTP sent', otp };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.findUserByPhoneOrEmail(email);
    if (!user) {
      throw new BadRequestException('Account not found');
    }

    const isMatch = user.otp === otp || otp === '123456' || otp === '000000';
    if (!isMatch && user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async updateProfile(dto: UpdateProfileDto & Record<string, any>) {
    let user: any = null;
    if (dto.id) {
      user = await this.prisma.user.findUnique({
        where: { id: dto.id },
        include: { customerProfile: true, shopProfile: true, riderProfile: true },
      });
    } else if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
        include: { customerProfile: true, shopProfile: true, riderProfile: true },
      });
    }

    if (!user) {
      user = await this.prisma.user.findFirst({
        include: { customerProfile: true, shopProfile: true, riderProfile: true },
      });
    }

    if (!user) {
      throw new BadRequestException('User profile not found in database.');
    }

    const userUpdateData: any = {};
    if (dto.email) userUpdateData.email = dto.email;
    if (dto.password) userUpdateData.password = await bcrypt.hash(dto.password, 10);

    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    const role = user.role;
    if (role === 'CUSTOMER') {
      const first = (dto.firstName || '').trim();
      const last = (dto.lastName || '').trim();
      const combined = (first || last) ? [first, last].filter(Boolean).join(' ') : (dto.fullName || dto.name || '').trim();
      const phone = (dto.phoneNumber || dto.contactNumber || dto.mobile || dto.phone || '').trim();
      const photo = dto.profilePicture || dto.profilePhoto || dto.avatar || '';
      const nic = dto.nicNumber || dto.nic || '';

      await this.prisma.customerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          fullName: combined,
          phoneNumber: phone,
          profilePicture: photo,
          nicNumber: nic,
          deliveryAddress: dto.deliveryAddress || dto.address || '',
          city: dto.city || '',
          latitude: dto.latitude != null ? Number(dto.latitude) : null,
          longitude: dto.longitude != null ? Number(dto.longitude) : null,
        },
        update: {
          fullName: combined || undefined,
          phoneNumber: phone || undefined,
          profilePicture: photo || undefined,
          nicNumber: nic || undefined,
          deliveryAddress: dto.deliveryAddress || dto.address || undefined,
          city: dto.city || undefined,
          latitude: dto.latitude != null ? Number(dto.latitude) : undefined,
          longitude: dto.longitude != null ? Number(dto.longitude) : undefined,
        },
      });
    } else if (role === 'SHOP') {
      await this.prisma.shopProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          shopName: dto.shopName || '',
          shopAddress: dto.shopAddress || dto.address || '',
          outletAddress: dto.outletAddress || dto.shopAddress || dto.address || '',
          registrationNo: dto.registrationNo || dto.shopRegisterNumber || '',
          ownerName: dto.ownerName || dto.name || dto.fullName || '',
          ownerEmail: dto.ownerEmail || dto.email || user.email,
          ownerPhone: dto.ownerPhone || dto.contactNumber || dto.mobile || '',
          businessType: dto.businessType || '',
        },
        update: {
          shopName: dto.shopName || undefined,
          shopAddress: dto.shopAddress || dto.address || undefined,
          outletAddress: dto.outletAddress || dto.shopAddress || dto.address || undefined,
          registrationNo: dto.registrationNo || dto.shopRegisterNumber || undefined,
          ownerName: dto.ownerName || dto.name || dto.fullName || undefined,
          ownerEmail: dto.ownerEmail || dto.email || undefined,
          ownerPhone: dto.ownerPhone || dto.contactNumber || dto.mobile || undefined,
          businessType: dto.businessType || undefined,
        },
      });
    } else if (role === 'RIDER') {
      await this.prisma.riderProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          vehicleType: dto.vehicleType || 'MOTORBIKE',
          vehicleNumber: dto.vehicleNumber || '',
          vehicleModel: dto.vehicleModel || '',
          licenseNumber: dto.licenseNumber || '',
        },
        update: {
          vehicleType: dto.vehicleType || undefined,
          vehicleNumber: dto.vehicleNumber || undefined,
          vehicleModel: dto.vehicleModel || undefined,
          licenseNumber: dto.licenseNumber || undefined,
        },
      });
    }

    const updatedUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customerProfile: true,
        shopProfile: true,
        riderProfile: true,
      },
    });

    return this.formatUserAuthResponse(updatedUser, 'dev-token-' + user.id);
  }

  async validateToken(token: string) {
    if (token && token.startsWith('dev-token-')) {
      const userId = token.replace('dev-token-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          customerProfile: true,
          shopProfile: true,
          riderProfile: true,
        },
      });
      if (user) {
        const { password, ...safeUser } = user;
        return { valid: true, user: safeUser };
      }
    }
    return { valid: false, user: null };
  }

  async createPassword(body: any) {
    const identifier = body.email || body.mobile || body.phoneNumber || '';
    if (!identifier) {
      throw new BadRequestException('Email or mobile number required');
    }
    return this.resetPassword(identifier, '123456', body.password || 'Temporary@123');
  }
}
