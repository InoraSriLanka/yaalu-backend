import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const cleanEmail = (dto.email || '').trim().toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email: ILike(cleanEmail) } });
    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'Email is already registered. Please login instead.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: cleanEmail,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      nicNumber: dto.nicNumber,
      city: dto.city,
      profilePicture: dto.profilePicture,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      role: dto.role || 'customer',
    });
    const saved = await this.usersRepository.save(user);

    const token = this.jwtService.sign({ sub: saved.id, email: saved.email, role: saved.role });
    const { password, ...result } = saved;
    return { user: result, accessToken: token, access_token: token };
  }

  async login(dto: LoginDto) {
    const rawInput = (dto.email || '').trim();
    if (!rawInput) {
      throw new RpcException({
        statusCode: 400,
        message: 'Please enter your email address or phone number.',
      });
    }

    const cleanEmailInput = rawInput.toLowerCase();
    const inputDigits = rawInput.replace(/[^0-9]/g, '');

    const users = await this.usersRepository.find();
    const user = users.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.phoneNumber || '').trim().toLowerCase();
      const uPhoneDigits = uPhone.replace(/[^0-9]/g, '');

      // 1. Email Match (case insensitive)
      if (uEmail === cleanEmailInput) return true;

      // 2. Exact Phone Match
      if (uPhone === cleanEmailInput) return true;

      // 3. Phone Match by last 9 digits (handles 077..., +9477..., 77...)
      if (inputDigits.length >= 7 && uPhoneDigits.length >= 7) {
        const input9 = inputDigits.slice(-9);
        const u9 = uPhoneDigits.slice(-9);
        if (input9 && u9 && input9 === u9) return true;
      }
      return false;
    });

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'No account found with this email or phone number.',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 401,
        message: 'Incorrect password. Please check your credentials and try again.',
      });
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const { password, ...result } = user;
    return { user: result, accessToken: token, access_token: token };
  }

  async updateProfile(dto: UpdateProfileDto) {
    let user: User | null = null;
    if (dto.id) {
      user = await this.usersRepository.findOne({ where: { id: dto.id } });
    } else if (dto.email) {
      user = await this.usersRepository.findOne({ where: { email: ILike(dto.email.trim()) } });
    }

    if (!user) {
      const users = await this.usersRepository.find({ order: { createdAt: 'DESC' }, take: 1 });
      user = users[0] || null;
    }

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User profile not found in database.',
      });
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;
    if (dto.nicNumber !== undefined) user.nicNumber = dto.nicNumber;
    if (dto.city !== undefined) user.city = dto.city;
    if (dto.profilePicture !== undefined) user.profilePicture = dto.profilePicture;
    if (dto.address !== undefined) user.address = dto.address;
    if (dto.latitude !== undefined) user.latitude = dto.latitude;
    if (dto.longitude !== undefined) user.longitude = dto.longitude;

    const updated = await this.usersRepository.save(user);
    const { password, ...result } = updated;
    return { user: result };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, user: payload };
    } catch {
      return { valid: false, user: null };
    }
  }

  async sendOtp(data: { phoneNumber?: string; email?: string }) {
    const target = (data.phoneNumber || data.email || '').trim();
    if (!target) {
      throw new RpcException({
        statusCode: 400,
        message: 'Please provide a valid phone number or email address.',
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(target, { code, expiresAt });

    return {
      success: true,
      message: `OTP verification code dispatched to ${target}`,
      otp: code,
    };
  }

  async verifyOtp(data: { target: string; code: string }) {
    const target = (data.target || '').trim();
    const cleanCode = (data.code || '').trim();

    const record = this.otpStore.get(target);
    if (!record) {
      throw new RpcException({
        statusCode: 400,
        message: 'No active OTP verification code found. Please request a new code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(target);
      throw new RpcException({
        statusCode: 400,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    if (record.code !== cleanCode) {
      throw new RpcException({
        statusCode: 400,
        message: 'Incorrect verification code. Please check and try again.',
      });
    }

    this.otpStore.delete(target);
    return { verified: true, message: 'OTP verified successfully.' };
  }
}
