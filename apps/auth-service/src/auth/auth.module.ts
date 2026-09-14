import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RiderProfile } from '../users/entities/rider-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, RiderProfile])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
