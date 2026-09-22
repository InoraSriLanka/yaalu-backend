import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MerchantsModule } from '../merchants/merchants.module';
import { SmsService } from '../sms/sms.service';

@Module({
  imports: [MerchantsModule],
  controllers: [AuthController],
  providers: [AuthService, SmsService],
  exports: [AuthService, SmsService],
})
export class AuthModule {}
