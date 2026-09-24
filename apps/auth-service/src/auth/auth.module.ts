import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MerchantsModule } from '../merchants/merchants.module';
import { SmsService } from '../sms/sms.service';
import { UploadsController } from '../uploads/uploads.controller';
import { UploadsService } from '../uploads/uploads.service';

@Module({
  imports: [MerchantsModule],
  controllers: [AuthController, UploadsController],
  providers: [AuthService, SmsService, UploadsService],
  exports: [AuthService, SmsService, UploadsService],
})
export class AuthModule {}
