import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // Text.lk SMS Gateway Configuration
  private readonly apiToken =
    process.env.SMS_API_TOKEN ||
    process.env.SMS_API_KEY ||
    '7194|zP9yVoY1EiX4zse7ZrE3mV18nBW01KNecSpIIu9Qb6c1349d';
  private readonly senderId = process.env.SMS_SENDER_ID || 'YaaluApp';
  private readonly endpoint =
    process.env.SMS_ENDPOINT || 'https://app.text.lk/api/v3/sms/send';

  /**
   * Normalize Sri Lankan phone numbers to international 947XXXXXXXX format
   */
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+94')) {
      return cleaned.substring(1);
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '94' + cleaned.substring(1);
    }
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '94' + cleaned;
    }
    return cleaned;
  }

  /**
   * Send SMS OTP via Text.lk v3 Gateway
   */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const recipient = this.formatPhoneNumber(phone);
    const message = `Your Yaalu App verification code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

    this.logger.log(`[Text.lk SMS Gateway] Sending OTP to ${recipient}...`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          recipient,
          sender_id: this.senderId,
          type: 'plain',
          message,
        }),
      });

      const data: any = await response.json().catch(() => null);
      this.logger.log(`[Text.lk SMS Gateway] Response: ${JSON.stringify(data)}`);

      if (data && data.status === 'success') {
        return true;
      } else {
        this.logger.warn(`[Text.lk SMS Gateway Warning] ${data?.message || 'Failed to dispatch SMS'}. [OTP: ${otp}]`);
        return false;
      }
    } catch (err: any) {
      this.logger.warn(
        `[Text.lk SMS Gateway Error] Dispatch error: ${err.message}. [OTP for ${recipient}: ${otp}]`
      );
      return false;
    }
  }
}
