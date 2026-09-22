import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /**
   * Backend Mobile Phone OTP Dispatch Service.
   * Generates and logs OTP locally with high visibility for dev mode,
   * while providing a hook for production SMS Gateway APIs (Twilio/Notify.lk).
   */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const timestamp = new Date().toISOString();

    this.logger.log(`\n&currency; [BACKEND MOBILE PHONE OTP DISPATCH==============]:mobile=${phone}, otp=${otp}, time=${timestamp}`);

    return true;
  }
}
