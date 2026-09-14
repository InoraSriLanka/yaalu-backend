import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new RpcException({ message: 'Email is already registered', statusCode: 409 });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userRole = (dto.role || 'customer').toUpperCase();

    const user = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
      role: userRole,
    });
    const savedUser = await this.usersRepository.save(user);

    let riderProfile: RiderProfile | null = null;
    if (userRole === 'RIDER' || userRole === 'DRIVER') {
      const existingProfile = await this.riderProfilesRepository.findOne({ where: { userId: savedUser.id } });
      if (!existingProfile) {
        const newProfile = this.riderProfilesRepository.create({
          userId: savedUser.id,
          fullName: dto.fullName || `${dto.firstName || ''} ${dto.lastName || ''}`.trim() || undefined,
          phoneNumber: dto.phoneNumber || dto.phone || dto.mobile || dto.contactNumber,
          profilePicture: dto.profilePicture || dto.profilePhoto || dto.avatar,
          nicNumber: dto.nicNumber || dto.nic,
          city: dto.city,
          address: dto.address || dto.deliveryAddress,
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber || dto.plateNumber,
          vehicleModel: dto.vehicleModel,
          vehiclePhoto: dto.vehiclePhoto,
          registrationDoc: dto.registrationDoc,
          licenseNumber: dto.licenseNumber,
          licenseExpiryDate: dto.licenseExpiryDate,
          licenseFrontPhoto: dto.licenseFrontPhoto,
          licenseBackPhoto: dto.licenseBackPhoto,
          policeClearanceDoc: dto.policeClearanceDoc,
          bankName: dto.bankName,
          accountHolder: dto.accountHolder,
          accountNumber: dto.accountNumber,
          branchCode: dto.branchCode,
          status: 'PENDING',
        });
        riderProfile = await this.riderProfilesRepository.save(newProfile);
      } else {
        riderProfile = existingProfile;
      }
    }

    const { password, ...result } = savedUser;
    return {
      ...result,
      riderProfile: riderProfile || undefined,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new RpcException({ message: 'Invalid email or password', statusCode: 401 });
    }

    let riderProfile: RiderProfile | null = null;
    const userRole = (user.role || '').toUpperCase();
    if (userRole === 'RIDER' || userRole === 'DRIVER') {
      riderProfile = await this.riderProfilesRepository.findOne({ where: { userId: user.id } });
    }

    const { password, ...result } = user;
    return {
      ...result,
      riderProfile: riderProfile || undefined,
    };
  }
}
