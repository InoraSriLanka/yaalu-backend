import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [MerchantsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
