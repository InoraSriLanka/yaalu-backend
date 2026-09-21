import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';
import { RiderProfile } from '../users/entities/rider-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(RiderProfile) private readonly riderProfilesRepository: Repository<RiderProfile>,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email) {
      throw new RpcException({ message: 'Email is required for registration', statusCode: 400 });
    }

    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new RpcException({ message: 'Email is already registered', statusCode: 409 });
    }

    const rawPassword = dto.password || 'RiderPass123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userRole = (dto.role || 'customer').toUpperCase();
    const riderPhone = (dto.phoneNumber || dto.phone || dto.mobile || dto.contactNumber || '').trim();
    const riderNic = (dto.nicNumber || dto.nic || '').trim();
    const riderName = dto.fullName || ((dto.firstName || '') + ' ' + (dto.lastName || '')).trim() || (dto as any).name || 'Rider Partner';

    const userId = randomUUID();
    const now = new Date();
    const userToCreate = this.usersRepository.create({
      id: userId,
      email: dto.email,
      password: hashedPassword,
      role: userRole,
      fullName: riderName,
      firstName: dto.firstName || '',
      lastName: dto.lastName || '',
      phoneNumber: riderPhone || '',
      nicNumber: riderNic || '',
      address: dto.address || dto.deliveryAddress || '',
      city: dto.city || '',
      profilePicture: dto.profilePicture || dto.profilePhoto || dto.avatar || '',
      vehicleType: dto.vehicleType || '',
      vehicleModel: dto.vehicleModel || '',
      plateNumber: dto.plateNumber || dto.vehicleNumber || '',
      vehiclePhoto: dto.vehiclePhoto || '',
      registrationDoc: dto.registrationDoc || '',
      licenseNumber: dto.licenseNumber || '',
      licenseExpiryDate: dto.licenseExpiryDate || '',
      licenseFrontPhoto: dto.licenseFrontPhoto || '',
      licenseBackPhoto: dto.licenseBackPhoto || '',
      policeClearanceDoc: dto.policeClearanceDoc || '',
      bankName: dto.bankName || '',
      accountHolder: dto.accountHolder || '',
      accountNumber: dto.accountNumber || '',
      branchCode: dto.branchCode || '',
      createdAt: now,
      updatedAt: now,
    });
    const savedUser = (await this.usersRepository.save(userToCreate)) as User;

    let riderProfile: RiderProfile | null = null;
    if (userRole === 'RIDER' || userRole === 'DRIVER') {
      let profile = await this.riderProfilesRepository.findOne({ where: { userId: savedUser.id } });
      if (!profile) {
        profile = this.riderProfilesRepository.create({
          id: randomUUID(),
          userId: savedUser.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      profile.fullName = riderName;
      profile.phoneNumber = riderPhone || profile.phoneNumber || '';
      profile.profilePhotoUrl = dto.profilePicture || dto.profilePhoto || dto.avatar || profile.profilePhotoUrl || '';
      profile.nicNumber = riderNic || profile.nicNumber || '';
      profile.city = dto.city || profile.city || '';
      profile.address = dto.address || dto.deliveryAddress || profile.address || '';
      profile.vehicleType = dto.vehicleType || profile.vehicleType || 'MOTORBIKE';
      profile.vehicleNumber = dto.vehicleNumber || dto.plateNumber || profile.vehicleNumber || '';
      profile.vehicleModel = dto.vehicleModel || profile.vehicleModel || '';
      profile.licenseNumber = dto.licenseNumber || profile.licenseNumber || '';
      profile.licenseExpiry = dto.licenseExpiryDate || profile.licenseExpiry || '';
      profile.licenseFrontUrl = dto.licenseFrontPhoto || profile.licenseFrontUrl || '';
      profile.licenseBackUrl = dto.licenseBackPhoto || profile.licenseBackUrl || '';
      profile.bankName = dto.bankName || profile.bankName || '';
      profile.accountName = dto.accountHolder || profile.accountName || '';
      profile.accountNo = dto.accountNumber || profile.accountNo || '';
      profile.accountBranch = dto.branchCode || profile.accountBranch || '';
      profile.status = profile.status || 'PENDING';
      profile.updatedAt = new Date();

      riderProfile = (await this.riderProfilesRepository.save(profile)) as RiderProfile;
    }

    const { password, ...result } = savedUser;
    const formattedRider = riderProfile ? {
      ...riderProfile,
      accountHolder: riderProfile.accountName,
      accountNumber: riderProfile.accountNo,
      branchCode: riderProfile.accountBranch,
      profilePicture: riderProfile.profilePhotoUrl,
      licenseExpiryDate: riderProfile.licenseExpiry,
      licenseFrontPhoto: riderProfile.licenseFrontUrl,
      licenseBackPhoto: riderProfile.licenseBackUrl,
    } : undefined;

    return {
      ...result,
      user: { ...result },
      rider: formattedRider,
      riderProfile: formattedRider,
      accessToken: 'token_' + savedUser.id,
    };
  }

  async login(dto: LoginDto) {
    const rawIdentifier = (dto.email || dto.mobile || dto.phone || dto.phoneNumber || '').trim();
    const cleanIdentifier = rawIdentifier.toLowerCase();
    const digitsOnly = rawIdentifier.replace(/[^0-9]/g, '');

    let user: User | null = null;
    if (cleanIdentifier.includes('@')) {
      user = await this.usersRepository.findOne({ where: { email: cleanIdentifier } });
    }

    if (!user && digitsOnly.length >= 7) {
      const allUsers = await this.usersRepository.find();
      user = allUsers.find(u => {
        const uPhoneDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');
        const uEmailDigits = (u.email || '').replace(/[^0-9]/g, '');
        return (
          (u.phoneNumber && u.phoneNumber === rawIdentifier) ||
          (uPhoneDigits && uPhoneDigits.endsWith(digitsOnly.slice(-9))) ||
          (uEmailDigits && uEmailDigits.endsWith(digitsOnly.slice(-9)))
        );
      }) || null;
    }

    if (!user) {
      const profiles = await this.riderProfilesRepository.find();
      const profile = profiles.find(p => {
        if (!p.phoneNumber) return false;
        const pDigits = p.phoneNumber.replace(/[^0-9]/g, '');
        return (
          p.phoneNumber === rawIdentifier ||
          p.phoneNumber.toLowerCase() === cleanIdentifier ||
          (digitsOnly.length >= 7 && pDigits.endsWith(digitsOnly.slice(-9)))
        );
      });

      if (profile?.userId) {
        user = await this.usersRepository.findOne({ where: { id: profile.userId } });
      }
    }

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new RpcException({ message: 'Invalid email/mobile or password', statusCode: 401 });
    }

    let riderProfile: RiderProfile | null = null;
    const userRole = (user.role || '').toUpperCase();
    if (userRole === 'RIDER' || userRole === 'DRIVER') {
      riderProfile = await this.riderProfilesRepository.findOne({ where: { userId: user.id } });
    }

    const { password, ...result } = user;
    const formattedRider = riderProfile ? {
      ...riderProfile,
      accountHolder: riderProfile.accountName,
      accountNumber: riderProfile.accountNo,
      branchCode: riderProfile.accountBranch,
      profilePicture: riderProfile.profilePhotoUrl,
      licenseExpiryDate: riderProfile.licenseExpiry,
      licenseFrontPhoto: riderProfile.licenseFrontUrl,
      licenseBackPhoto: riderProfile.licenseBackUrl,
    } : undefined;

    return {
      ...result,
      user: { ...result },
      rider: formattedRider,
      riderProfile: formattedRider,
      accessToken: 'token_' + user.id,
    };
  }
}
