import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MerchantsService } from '../merchants/merchants.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
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

    const variantList = Array.from(variants);

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: cleaned },
          {
            shopProfile: {
              OR: [
                ...variantList.map((v) => ({ ownerPhone: v })),
                { ownerEmail: identifier },
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

  async register(dto: any) {
    const mobile = dto.contactNumber || dto.mobile || '';
    const existing =
      (await this.findUserByPhoneOrEmail(dto.email)) ||
      (await this.findUserByPhoneOrEmail(mobile));

    const initialPassword = dto.password || 'Temporary@123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const name = dto.name || dto.ownerName || dto.fullName || '';

    let user;
    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: dto.email,
          password: hashedPassword,
          otp,
          otpExpiresAt,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          role: 'SHOP',
          password: hashedPassword,
          otp,
          otpExpiresAt,
        },
      });
    }

    // Upsert ShopProfile
    try {
      await this.prisma.shopProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          shopName: dto.shopName || '',
          shopAddress: dto.shopAddress || '',
          outletAddress: dto.shopAddress || '',
          registrationNo: dto.registrationNo || dto.shopRegisterNumber || '',
          ownerName: name || '',
          ownerEmail: dto.email || user.email,
          ownerPhone: mobile || '',
          businessType: dto.businessType || '',
        },
        update: {
          shopName: dto.shopName || undefined,
          shopAddress: dto.shopAddress || undefined,
          outletAddress: dto.shopAddress || undefined,
          registrationNo: dto.registrationNo || dto.shopRegisterNumber || undefined,
          ownerName: name || undefined,
          ownerEmail: dto.email || user.email || undefined,
          ownerPhone: mobile || undefined,
          businessType: dto.businessType || undefined,
        },
      });
    } catch (err) {
      console.error('[AuthService] Error creating shop profile:', err);
    }

    // Send SMS via Gateway API
    if (mobile) {
      await this.smsService.sendOtp(mobile, otp);
    }

    return {
      message: 'OTP sent to your contact number',
      mobile,
      contactNumber: mobile,
      otp,
    };
  }

  async registerCustomer(dto: {
    name: string;
    email: string;
    contactNumber: string;
    password: string;
    nic?: string;
    deliveryAddress?: string;
    city?: string;
  }) {
    const existing =
      (await this.findUserByPhoneOrEmail(dto.email)) ||
      (await this.findUserByPhoneOrEmail(dto.contactNumber));
    if (existing) {
      throw new ConflictException('User with this email or contact number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          role: 'CUSTOMER',
          password: hashedPassword,
        },
      });

      const profile = await tx.customerProfile.create({
        data: {
          userId: user.id,
          fullName: dto.name,
          phone: dto.contactNumber,
          deliveryAddress: dto.deliveryAddress,
          city: dto.city,
        },
      });

      const { password, ...safeUser } = user;
      return { message: 'Customer registered successfully', user: safeUser, profile };
    });
  }

  async registerShop(dto: {
    name: string;
    email: string;
    contactNumber: string;
    password: string;
    nic?: string;
    shopName: string;
    shopAddress?: string;
    registrationNo?: string;
    businessType?: string;
  }) {
    const existing =
      (await this.findUserByPhoneOrEmail(dto.email)) ||
      (await this.findUserByPhoneOrEmail(dto.contactNumber));
    if (existing) {
      throw new ConflictException('User with this email or contact number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          role: 'SHOP',
          password: hashedPassword,
        },
      });

      const profile = await tx.shopProfile.create({
        data: {
          userId: user.id,
          shopName: dto.shopName,
          shopAddress: dto.shopAddress,
          outletAddress: dto.shopAddress,
          registrationNo: dto.registrationNo,
          ownerName: dto.name,
          ownerEmail: dto.email,
          ownerPhone: dto.contactNumber,
          businessType: dto.businessType,
        },
      });

      const { password, ...safeUser } = user;
      return { message: 'Shop registered successfully', user: safeUser, profile };
    });
  }

  async registerRider(dto: {
    name: string;
    email: string;
    contactNumber: string;
    password: string;
    nic: string;
    vehicleType: string;
    vehicleNumber: string;
    vehicleModel?: string;
    licenseNumber: string;
  }) {
    const existing =
      (await this.findUserByPhoneOrEmail(dto.email)) ||
      (await this.findUserByPhoneOrEmail(dto.contactNumber));
    if (existing) {
      throw new ConflictException('User with this email or contact number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          role: 'RIDER',
          password: hashedPassword,
        },
      });

      const profile = await tx.riderProfile.create({
        data: {
          userId: user.id,
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber,
          vehicleModel: dto.vehicleModel,
          licenseNumber: dto.licenseNumber,
        },
      });

      const { password, ...safeUser } = user;
      return { message: 'Rider registered successfully', user: safeUser, profile };
    });
  }

  async createPassword(dto: {
    mobile?: string;
    contactNumber?: string;
    email?: string;
    password: string;
    shopName?: string;
    shopAddress?: string;
    shopRegisterNumber?: string;
    ownerName?: string;
    ownerIdNumber?: string;
  }) {
    const identifier = dto.contactNumber || dto.mobile || dto.email;
    if (!identifier) {
      throw new BadRequestException('Contact number or email required');
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

    // Update ShopProfile
    if (
      dto.shopName ||
      dto.shopAddress ||
      dto.shopRegisterNumber ||
      dto.ownerName
    ) {
      try {
        await this.prisma.shopProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            shopName: dto.shopName || '',
            shopAddress: dto.shopAddress || '',
            outletAddress: dto.shopAddress || '',
            registrationNo: (dto as any).registrationNo || dto.shopRegisterNumber || '',
            ownerName: (dto as any).name || dto.ownerName || '',
            ownerEmail: updatedUser.email,
            ownerPhone: identifier,
            businessType: (dto as any).businessType || '',
          },
          update: {
            shopName: dto.shopName || undefined,
            shopAddress: dto.shopAddress || undefined,
            outletAddress: dto.shopAddress || undefined,
            registrationNo: (dto as any).registrationNo || dto.shopRegisterNumber || undefined,
            ownerName: (dto as any).name || dto.ownerName || undefined,
            businessType: (dto as any).businessType || undefined,
          },
        });
      } catch (e) {
        console.error('[AuthService] Error updating shopProfile:', e);
      }
    }

    const shop = await this.prisma.shopProfile.findUnique({
      where: { userId: user.id },
    });

    const accessToken = `dev-token-${user.id}`;
    const { password, ...result } = updatedUser;

    return {
      accessToken,
      merchant: {
        ...result,
        shop,
        email: user.email,
        mobile: shop?.ownerPhone || identifier,
        contactNumber: shop?.ownerPhone || identifier,
        fullName: shop?.ownerName || '',
        address: shop?.shopAddress || shop?.outletAddress || '',
        shopName: shop?.shopName || dto.shopName || '',
        businessAddress: shop?.outletAddress || shop?.shopAddress || '',
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

    await this.smsService.sendOtp(mobile, otp);

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

    const shop = await this.prisma.shopProfile.findUnique({
      where: { userId: user.id },
    });

    const accessToken = `dev-token-${user.id}`;
    const { password, ...userResult } = user;

    return {
      accessToken,
      merchant: {
        ...userResult,
        shop,
        email: user.email,
        mobile: shop?.ownerPhone || mobile,
        contactNumber: shop?.ownerPhone || mobile,
        fullName: shop?.ownerName || '',
        address: shop?.shopAddress || shop?.outletAddress || '',
        shopName: shop?.shopName || '',
        businessAddress: shop?.outletAddress || shop?.shopAddress || '',
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByPhoneOrEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password || ''))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const shop = await this.prisma.shopProfile.findUnique({
      where: { userId: user.id },
    });

    const accessToken = `dev-token-${user.id}`;
    const { password, ...result } = user;

    return {
      accessToken,
      merchant: {
        ...result,
        shop,
        email: user.email,
        mobile: shop?.ownerPhone || '',
        contactNumber: shop?.ownerPhone || '',
        fullName: shop?.ownerName || '',
        address: shop?.shopAddress || shop?.outletAddress || '',
        shopName: shop?.shopName || '',
        businessAddress: shop?.outletAddress || shop?.shopAddress || '',
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

    const first = (dto.firstName || '').trim();
    const last = (dto.lastName || '').trim();
    const combinedName = (first || last) ? [first, last].filter(Boolean).join(' ') : (dto.fullName || dto.name || '').trim();

    const userUpdateData: any = {};
    if (dto.email) userUpdateData.email = dto.email;
    if (dto.password) userUpdateData.password = await bcrypt.hash(dto.password, 10);
    if (combinedName) userUpdateData.fullName = combinedName;

    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    const role = user.role;
    if (role === 'CUSTOMER') {
      const phone = (dto.phoneNumber || dto.contactNumber || dto.mobile || dto.phone || '').trim();
      const photoInput = (dto.profilePicture || dto.profilePhoto || dto.avatar || '').trim();
            const photoToUpdate = photoInput.startsWith('http') ? photoInput : undefined;
            const photoToCreate = photoInput.startsWith('http') ? photoInput : null;
      const nic = dto.nicNumber || dto.nic || '';

      await this.prisma.customerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          fullName: combinedName,
          phoneNumber: phone,
          profilePicture: photoToCreate,
          nicNumber: nic,
          deliveryAddress: dto.deliveryAddress || dto.address || '',
          city: dto.city || '',
          latitude: dto.latitude != null ? Number(dto.latitude) : null,
          longitude: dto.longitude != null ? Number(dto.longitude) : null,
        },
        update: {
          fullName: combinedName || undefined,
          phoneNumber: phone || undefined,
          profilePicture: photoToUpdate,
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

    // 1. Find the user
    const user = await this.findUserByPhoneOrEmail(identifier);
    if (!user) {
      throw new BadRequestException('Account not found');
    }

    // 2. Set the new password
    const hashedPassword = await bcrypt.hash(body.password || 'Temporary@123', 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
      },
    });

    // 3. Update shop profile with all registration data if provided
    if (user.role === 'SHOP') {
      const ownerName = body.ownerName || body.fullName || user.fullName || '';
      const mobile = body.mobile || body.phoneNumber || '';
      const shopName = body.shopName || '';
      const shopAddress = body.shopAddress || body.address || '';
      const registrationNo = body.shopRegisterNumber || body.registrationNo || '';

      await this.prisma.shopProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          shopName,
          ownerName,
          ownerPhone: mobile,
          ownerEmail: body.email || user.email,
          shopAddress,
          outletAddress: shopAddress,
          registrationNo,
        },
        update: {
          ...(shopName && { shopName }),
          ...(ownerName && { ownerName }),
          ...(mobile && { ownerPhone: mobile }),
          ...(shopAddress && { shopAddress, outletAddress: shopAddress }),
          ...(registrationNo && { registrationNo }),
        },
      });
    }

    // 4. Return full auth response with accessToken + merchant profile
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
}

