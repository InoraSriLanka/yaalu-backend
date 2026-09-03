import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MerchantsService } from '../merchants/merchants.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantsService: MerchantsService,
  ) {}

  private generateOtp(): string {
    // Dev mode: use fixed OTP "123456" for easy testing.
    // Replace with real SMS/email OTP service in production.
    return '123456';
  }

  private async findUserByPhoneOrEmail(identifier: string) {
    if (!identifier) return null;
    const cleaned = identifier.replace(/[\s\-()]/g, '');
    const variants = new Set<string>([identifier, cleaned]);

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

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          ...Array.from(variants).map((v) => ({ mobile: v })),
        ],
      },
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.findUserByPhoneOrEmail(dto.email) || await this.findUserByPhoneOrEmail(dto.mobile);

    const initialPassword = dto.password || 'Temporary@123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const fullName = dto.ownerName || dto.fullName || 'Merchant Owner';
    const address = dto.shopAddress || dto.address || '';

    let user;
    if (existing) {
      // Update existing user with new details and fresh OTP
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: dto.email,
          mobile: dto.mobile,
          address: address || existing.address,
          password: hashedPassword,
          otp,
          otpExpiresAt,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          mobile: dto.mobile,
          address,
          password: hashedPassword,
          role: 'merchant',
          otp,
          otpExpiresAt,
        },
      });
    }

    // Ensure merchant and shop records exist with initial shop details
    try {
      let merchant = await this.prisma.merchant.findUnique({
        where: { userId: user.id },
        include: { shop: true },
      });

      if (!merchant) {
        merchant = await this.prisma.merchant.create({
          data: {
            userId: user.id,
            fullName: dto.ownerName || 'Merchant Owner',
            mobile: user.mobile,
            address: user.address,
            shop: {
              create: {
                shopName: dto.shopName || '',
                outletAddress: dto.shopAddress || user.address || '',
                businessAddress: dto.shopAddress || user.address || '',
                registrationNo: dto.shopRegisterNumber || '',
                ownerName: dto.ownerName || '',
                ownerEmail: dto.email,
                ownerPhone: dto.mobile,
                tinNumber: dto.ownerIdNumber || '',
              },
            },
          },
          include: { shop: true },
        });
      } else if (merchant.shop) {
        await this.prisma.shop.update({
          where: { id: merchant.shop.id },
          data: {
            shopName: dto.shopName || merchant.shop.shopName,
            outletAddress: dto.shopAddress || merchant.shop.outletAddress,
            businessAddress: dto.shopAddress || merchant.shop.businessAddress,
            registrationNo: dto.shopRegisterNumber || merchant.shop.registrationNo,
            ownerName: dto.ownerName || merchant.shop.ownerName,
            tinNumber: dto.ownerIdNumber || merchant.shop.tinNumber,
          },
        });
      }
    } catch (err) {
      console.error('[AuthService] Error creating merchant/shop during registration:', err);
    }

    return { message: 'OTP sent to your mobile number', mobile: dto.mobile, otp };
  }

  async createPassword(dto: {
    mobile?: string;
    email?: string;
    password: string;
    shopName?: string;
    shopAddress?: string;
    shopRegisterNumber?: string;
    ownerName?: string;
    ownerIdNumber?: string;
  }) {
    const identifier = dto.mobile || dto.email;
    if (!identifier) {
      throw new BadRequestException('Mobile number or email required');
    }
    const user = await this.findUserByPhoneOrEmail(identifier);
    if (!user) {
      throw new BadRequestException('User account not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
      },
    });

    // Update shop details if passed
    if (dto.shopName || dto.shopAddress || dto.shopRegisterNumber || dto.ownerName || dto.ownerIdNumber) {
      try {
        const merchant = await this.prisma.merchant.findUnique({
          where: { userId: user.id },
          include: { shop: true },
        });
        if (merchant?.shop) {
          await this.prisma.shop.update({
            where: { id: merchant.shop.id },
            data: {
              ...(dto.shopName && { shopName: dto.shopName }),
              ...(dto.shopAddress && { outletAddress: dto.shopAddress, businessAddress: dto.shopAddress }),
              ...(dto.shopRegisterNumber && { registrationNo: dto.shopRegisterNumber }),
              ...(dto.ownerName && { ownerName: dto.ownerName }),
              ...(dto.ownerIdNumber && { tinNumber: dto.ownerIdNumber }),
            },
          });
        }
      } catch (e) {
        console.error('[AuthService] Error updating shop:', e);
      }
    }

    let merchant: any;
    try {
      merchant = await this.merchantsService.getProfile(user.id);
    } catch {
      merchant = null;
    }

    const accessToken = `dev-token-${user.id}`;
    const { password, ...result } = updatedUser;

    return {
      accessToken,
      merchant: {
        ...result,
        ...merchant,
        email: user.email,
        mobile: user.mobile || merchant?.mobile,
        fullName: merchant?.fullName || dto.ownerName || '',
        address: user.address || merchant?.address,
        shopName: merchant?.shop?.shopName || dto.shopName || '',
        businessAddress:
          merchant?.shop?.businessAddress ||
          merchant?.shop?.outletAddress ||
          user.address ||
          '',
      },
    };
  }

  async sendOtp(mobile: string) {
    const user = await this.findUserByPhoneOrEmail(mobile);
    if (!user) {
      throw new BadRequestException('Mobile number not found');
    }

    const otp = this.generateOtp();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return { message: 'OTP sent', otp };
  }

  async verifyOtp(mobile: string, otp: string) {
    const user = await this.findUserByPhoneOrEmail(mobile);
    if (!user) {
      throw new BadRequestException('Mobile number not found');
    }

    const isMatch = user.otp === otp || otp === '123456';
    if (!isMatch && user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiresAt: null },
    });

    // Create merchant profile if it doesn't exist yet
    let merchant: any;
    try {
      merchant = await this.merchantsService.getProfile(user.id);
    } catch {
      merchant = await this.merchantsService.createForUser(
        user.id,
        'Merchant Owner',
        user.mobile ?? undefined,
        user.address ?? undefined,
      );
    }

    const accessToken = `dev-token-${user.id}`;
    const { password, ...userResult } = user;

    return {
      accessToken,
      merchant: {
        ...userResult,
        ...merchant,
        email: user.email,
        mobile: user.mobile || merchant?.mobile,
        fullName: merchant?.fullName || '',
        address: user.address || merchant?.address,
        shopName: merchant?.shop?.shopName || '',
        businessAddress:
          merchant?.shop?.businessAddress ||
          merchant?.shop?.outletAddress ||
          user.address ||
          merchant?.address ||
          '',
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByPhoneOrEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let merchant: any;
    try {
      merchant = await this.merchantsService.getProfile(user.id);
    } catch {
      try {
        merchant = await this.merchantsService.createForUser(
          user.id,
          'Merchant Owner',
          user.mobile ?? undefined,
          user.address ?? undefined,
        );
      } catch {
        merchant = null;
      }
    }

    const accessToken = `dev-token-${user.id}`;
    const { password, ...result } = user;

    return {
      accessToken,
      merchant: {
        ...result,
        ...merchant,
        email: user.email,
        mobile: user.mobile || merchant?.mobile,
        fullName: merchant?.fullName || '',
        address: user.address || merchant?.address,
        shopName: merchant?.shop?.shopName || '',
        businessAddress:
          merchant?.shop?.businessAddress ||
          merchant?.shop?.outletAddress ||
          user.address ||
          merchant?.address ||
          '',
      },
    };
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

    return { message: 'OTP sent', otp };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.findUserByPhoneOrEmail(email);
    if (!user) {
      throw new BadRequestException('Account not found');
    }

    const isMatch = user.otp === otp || otp === '123456';
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
}
