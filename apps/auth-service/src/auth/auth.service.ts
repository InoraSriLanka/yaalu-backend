import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'Email is already registered. Please login instead.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
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
    const input = dto.email ? dto.email.trim() : '';
    const user = await this.usersRepository.findOne({
      where: [{ email: input }, { phoneNumber: input }],
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
      user = await this.usersRepository.findOne({ where: { email: dto.email } });
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
}
