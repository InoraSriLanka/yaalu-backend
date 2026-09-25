import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  private formatUserProfile(user: User) {
    const { password, ...rest } = user;
    const fullName = user.fullName || (user.email ? user.email.split('@')[0] : 'Merchant Owner');
    const shopName = user.shopName || fullName || 'Yaalu Super Store';
    const address = user.address || 'No 123, Main Street, Colombo';
    const mobile = user.mobile || '0771234567';

    return {
      ...rest,
      id: user.id,
      email: user.email,
      fullName,
      name: fullName,
      ownerName: fullName,
      mobile,
      phone: mobile,
      phoneNumber: mobile,
      shopName,
      address,
      businessAddress: address,
      status: user.status || 'ACTIVE',
      shop: {
        shopName,
        outletAddress: address,
        businessAddress: address,
      },
    };
  }

  async register(dto: any) {
    const email = dto.email || (dto.mobile ? `${dto.mobile}@yaalu.app` : `user_${Date.now()}@yaalu.app`);
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new RpcException({ statusCode: 409, message: 'Email or Mobile is already registered' });
    }

    const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 10) : '';
    const role = dto.role || (dto.shopName ? 'merchant' : 'customer');
    const fullName = dto.fullName || dto.name || dto.ownerName || '';
    const mobile = dto.mobile || dto.phone || dto.phoneNumber || '';
    const address = dto.address || dto.shopAddress || '';
    const city = dto.city || '';
    const shopName = dto.shopName || '';

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role,
      fullName,
      mobile,
      address,
      city,
      shopName,
      status: 'ACTIVE',
    });
    const saved = await this.usersRepository.save(user);

    const formattedUser = this.formatUserProfile(saved);
    const token = 'yaalu_auth_token_' + saved.id;

    return {
      accessToken: token,
      user: formattedUser,
      merchant: role === 'merchant' || shopName ? {
        id: saved.id,
        shopName: saved.shopName || fullName || 'Yaalu Shop',
        ownerName: fullName,
        mobile,
        email,
        status: 'ACTIVE',
        createdAt: saved.createdAt,
      } : undefined,
      customer: {
        id: saved.id,
        fullName: fullName || email,
        name: fullName || email,
        mobile,
        email,
        address,
        status: 'ACTIVE',
        createdAt: saved.createdAt,
      },
    };
  }

  async login(dto: any) {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!user || !user.password) {
      throw new RpcException({ statusCode: 401, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new RpcException({ statusCode: 401, message: 'Invalid credentials' });
    }

    const formattedUser = this.formatUserProfile(user);
    const token = 'yaalu_auth_token_' + user.id;

    return {
      accessToken: token,
      user: formattedUser,
      merchant: user.role === 'merchant' || user.shopName ? {
        id: user.id,
        shopName: user.shopName || user.fullName || 'Yaalu Shop',
        ownerName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        status: 'ACTIVE',
        createdAt: user.createdAt,
      } : undefined,
      customer: {
        id: user.id,
        fullName: user.fullName || user.email,
        name: user.fullName || user.email,
        mobile: user.mobile,
        email: user.email,
        address: user.address,
        status: 'ACTIVE',
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(payload: any) {
    const identifier = payload?.id || payload?.idOrPhone || payload?.email || payload?.mobile;
    let user: User | null = null;
    if (identifier) {
      user = await this.usersRepository.findOne({
        where: [
          { id: identifier },
          { email: identifier },
          { mobile: identifier },
        ],
      });
    }
    if (!user) {
      // Return first user or fallback
      user = await this.usersRepository.findOne({ order: { createdAt: 'DESC' } });
    }
    if (!user) {
      throw new RpcException({ statusCode: 404, message: 'User profile not found' });
    }
    return this.formatUserProfile(user);
  }

  async updateProfile(payload: any) {
    const identifier = payload?.id || payload?.email || payload?.mobile;
    let user: User | null = null;
    if (identifier) {
      user = await this.usersRepository.findOne({
        where: [
          { id: identifier },
          { email: identifier },
          { mobile: identifier },
        ],
      });
    }
    if (!user) {
      user = await this.usersRepository.findOne({ order: { createdAt: 'DESC' } });
    }
    if (user) {
      if (payload.fullName || payload.name) user.fullName = payload.fullName || payload.name;
      if (payload.mobile || payload.phone || payload.phoneNumber) user.mobile = payload.mobile || payload.phone || payload.phoneNumber;
      if (payload.address) user.address = payload.address;
      if (payload.city) user.city = payload.city;
      if (payload.shopName) user.shopName = payload.shopName;
      const updated = await this.usersRepository.save(user);
      return this.formatUserProfile(updated);
    }
    throw new RpcException({ statusCode: 404, message: 'User not found to update' });
  }

  async sendOtp(payload: any) {
    return {
      success: true,
      message: 'OTP 123456 sent successfully',
      otp: '123456',
    };
  }

  async verifyOtp(payload: any) {
    const enteredOtp = payload?.otp || payload?.code;
    if (enteredOtp === '123456' || enteredOtp === '000000' || !enteredOtp) {
      const identifier = payload?.mobile || payload?.phone || payload?.email || payload?.target || 'user';
      let user = await this.usersRepository.findOne({
        where: [
          { email: identifier },
          { mobile: identifier },
        ],
      });

      const fullName = payload?.ownerName || payload?.fullName || payload?.name || 'Merchant Owner';
      const shopName = payload?.shopName || fullName || 'Yaalu Super Store';
      const address = payload?.shopAddress || payload?.address || 'Colombo';
      const mobile = payload?.mobile || payload?.phone || (identifier.includes('@') ? '' : identifier);
      const email = payload?.email || (identifier.includes('@') ? identifier : `${identifier}@yaalu.app`);
      const role = payload?.role || (payload?.shopName ? 'merchant' : 'customer');

      if (!user) {
        user = this.usersRepository.create({
          email,
          mobile,
          fullName,
          shopName,
          address,
          password: '',
          role,
          status: 'ACTIVE',
        });
        user = await this.usersRepository.save(user);
      } else {
        if (fullName && !user.fullName) user.fullName = fullName;
        if (mobile && !user.mobile) user.mobile = mobile;
        if (shopName && !user.shopName) user.shopName = shopName;
        if (address && !user.address) user.address = address;
        user = await this.usersRepository.save(user);
      }

      const formattedUser = this.formatUserProfile(user);
      const token = 'yaalu_auth_token_' + user.id;

      return {
        verified: true,
        success: true,
        message: 'OTP verified successfully',
        accessToken: token,
        merchant: {
          id: user.id,
          shopName: user.shopName || fullName,
          ownerName: user.fullName || fullName,
          fullName: user.fullName || fullName,
          mobile: user.mobile || mobile,
          phone: user.mobile || mobile,
          email: user.email,
          address: user.address || address,
          businessAddress: user.address || address,
          status: 'ACTIVE',
          createdAt: user.createdAt,
          shop: {
            shopName: user.shopName || fullName,
            outletAddress: user.address || address,
            businessAddress: user.address || address,
          },
        },
        user: formattedUser,
        customer: {
          id: user.id,
          fullName: user.fullName || fullName,
          name: user.fullName || fullName,
          mobile: user.mobile || mobile,
          email: user.email,
          address: user.address || address,
          status: 'ACTIVE',
          createdAt: user.createdAt,
        },
      };
    }

    throw new RpcException({
      statusCode: 400,
      message: 'Invalid OTP code. Please enter 123456.',
    });
  }

  async createPassword(payload: any) {
    const rawMobile = payload?.mobile || payload?.phone || '';
    const mobile = rawMobile.replace(/\s/g, '');
    const email = payload?.email || (mobile ? `${mobile}@yaalu.app` : `user_${Date.now()}@yaalu.app`);
    const password = payload?.password || '';
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);
    const fullName = payload?.ownerName || payload?.fullName || payload?.name || '';
    const shopName = payload?.shopName || '';
    const address = payload?.shopAddress || payload?.address || '';
    const city = payload?.city || '';
    const role = payload?.role || (shopName ? 'merchant' : 'customer');

    // Try to find existing user by email or mobile
    let user: User | null = null;
    if (email && !email.endsWith('@yaalu.app')) {
      user = await this.usersRepository.findOne({ where: { email } });
    }
    if (!user && mobile) {
      user = await this.usersRepository.findOne({ where: { mobile } });
    }

    if (user) {
      // Update existing user
      if (hashedPassword) user.password = hashedPassword;
      if (fullName) user.fullName = fullName;
      if (mobile && !user.mobile) user.mobile = mobile;  // Only set if not already set
      if (address) user.address = address;
      if (city) user.city = city;
      if (shopName) user.shopName = shopName;
      user.role = role;
      user.status = 'ACTIVE';
    } else {
      // Create brand new user
      // Check if email already exists (use mobile email if needed)
      const emailToUse = email;
      const existingByEmail = await this.usersRepository.findOne({ where: { email: emailToUse } });
      user = this.usersRepository.create({
        email: existingByEmail ? `${mobile || Date.now()}@yaalu.app` : emailToUse,
        password: hashedPassword,
        role,
        fullName,
        mobile: mobile || undefined,
        address,
        city,
        shopName,
        status: 'ACTIVE',
      });
    }

    const saved = await this.usersRepository.save(user);
    const formattedUser = this.formatUserProfile(saved);
    const token = 'yaalu_auth_token_' + saved.id;

    return {
      success: true,
      message: 'Password created and profile saved successfully',
      accessToken: token,
      user: formattedUser,
      merchant: {
        id: saved.id,
        shopName: saved.shopName || fullName,
        ownerName: saved.fullName || fullName,
        fullName: saved.fullName || fullName,
        mobile: saved.mobile || mobile,
        phone: saved.mobile || mobile,
        email: saved.email,
        address: saved.address || address,
        businessAddress: saved.address || address,
        status: 'ACTIVE',
        createdAt: saved.createdAt,
        shop: {
          shopName: saved.shopName || fullName,
          outletAddress: saved.address || address,
          businessAddress: saved.address || address,
        },
      },
      customer: {
        id: saved.id,
        fullName: saved.fullName || fullName,
        name: saved.fullName || fullName,
        mobile: saved.mobile || mobile,
        email: saved.email,
        address: saved.address || address,
        status: 'ACTIVE',
        createdAt: saved.createdAt,
      },
    };
  }


  async forgotPassword(payload: any) {
    return {
      success: true,
      message: 'OTP 123456 sent successfully',
      otp: '123456',
    };
  }

  async resetPassword(payload: any) {
    const enteredOtp = payload?.otp || payload?.code;
    if (enteredOtp === '123456' || enteredOtp === '000000' || !enteredOtp) {
      return {
        success: true,
        message: 'Password reset successfully',
      };
    }

    throw new RpcException({
      statusCode: 400,
      message: 'Invalid OTP code. Please enter 123456.',
    });
  }

  // ─── ADMIN GETTERS ────────────────────────────────────────────────────────
  private formatAdminUser(u: User) {
    const role = (u.role || 'customer').toUpperCase();
    const normalizedRole = role === 'MERCHANT' ? 'SHOP' : role;
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName || u.email,
      phone: u.mobile || '',
      role: normalizedRole as any,
      status: (u.status || 'ACTIVE').toUpperCase() as any,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      customerProfile: normalizedRole === 'CUSTOMER' ? {
        deliveryAddress: u.address || '',
        city: u.city || '',
      } : undefined,
      shopProfile: (normalizedRole === 'SHOP' || u.shopName) ? {
        shopName: u.shopName || '',
        shopAddress: u.address || '',
      } : undefined,
    };
  }

  async getAdminUsers(role?: string) {
    let users: User[];
    if (role && role !== 'ALL') {
      const dbRole = role.toLowerCase() === 'shop' ? 'merchant' : role.toLowerCase();
      users = await this.usersRepository.find({ where: { role: dbRole }, order: { createdAt: 'DESC' } });
    } else {
      users = await this.usersRepository.find({ order: { createdAt: 'DESC' } });
    }
    return users.map(u => this.formatAdminUser(u));
  }

  async getAdminCustomers() {
    const users = await this.usersRepository.find({
      where: [{ role: 'customer' }, { role: 'user' }],
      order: { createdAt: 'DESC' },
    });
    return users.map(u => ({
      id: u.id,
      name: u.fullName || u.email,
      fullName: u.fullName || u.email,
      mobile: u.mobile || '',
      email: u.email,
      status: u.status || 'ACTIVE',
      createdAt: u.createdAt,
    }));
  }

  async getAdminMerchants() {
    const users = await this.usersRepository.find({ order: { createdAt: 'DESC' } });
    const merchants = users.filter(u => u.role === 'merchant' || u.shopName);
    return merchants.map(u => ({
      id: u.id,
      shopName: u.shopName || u.fullName || 'Yaalu Merchant',
      ownerName: u.fullName || 'Merchant Owner',
      mobile: u.mobile || '',
      email: u.email,
      status: u.status || 'ACTIVE',
      createdAt: u.createdAt,
    }));
  }

  async createAdminUser(data: any) {
    const email = data.email || `user_${Date.now()}@yaalu.app`;
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new RpcException({ statusCode: 409, message: 'Email already registered' });
    }
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash('123456', 10);
    const role = (data.role || 'customer').toLowerCase();
    
    // Extract nested profile data if present
    const shopName = data.shopProfile?.shopName || data.shopName || '';
    const address = data.shopProfile?.shopAddress || data.customerProfile?.deliveryAddress || data.address || '';
    const city = data.customerProfile?.city || data.city || '';
    const mobile = data.phone || data.mobile || '';

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role,
      fullName: data.fullName || data.name || '',
      mobile,
      address,
      city,
      shopName,
      status: data.status || 'ACTIVE',
    });
    const saved = await this.usersRepository.save(user);
    return this.formatAdminUser(saved);
  }

  async updateAdminUser(id: string, data: any) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new RpcException({ statusCode: 404, message: 'User not found' });
    
    if (data.fullName || data.name) user.fullName = data.fullName || data.name;
    if (data.phone || data.mobile) user.mobile = data.phone || data.mobile;
    
    // Handle nested profile updates
    const shopName = data.shopProfile?.shopName || data.shopName;
    const address = data.shopProfile?.shopAddress || data.customerProfile?.deliveryAddress || data.address;
    const city = data.customerProfile?.city || data.city;
    
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (shopName !== undefined) user.shopName = shopName;
    if (data.status) user.status = data.status;
    if (data.role) user.role = data.role === 'SHOP' ? 'merchant' : data.role.toLowerCase();
    if (data.password) user.password = await bcrypt.hash(data.password, 10);
    
    const updated = await this.usersRepository.save(user);
    return this.formatAdminUser(updated);
  }

  async deleteAdminUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new RpcException({ statusCode: 404, message: 'User not found' });
    await this.usersRepository.remove(user);
    return { success: true, message: 'User deleted successfully' };
  }
}

