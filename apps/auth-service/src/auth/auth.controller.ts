import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MSG_PATTERNS } from '@app/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MSG_PATTERNS.AUTH.REGISTER)
  @MessagePattern('register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern(MSG_PATTERNS.AUTH.LOGIN)
  @MessagePattern('login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern('send-otp')
  @MessagePattern(MSG_PATTERNS.AUTH.SEND_OTP)
  @MessagePattern('send_otp')
  sendOtp(@Payload() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @MessagePattern('verify-otp')
  @MessagePattern(MSG_PATTERNS.AUTH.VERIFY_OTP)
  @MessagePattern('verify_otp')
  verifyOtp(@Payload() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @MessagePattern(MSG_PATTERNS.AUTH.UPDATE_PROFILE)
  @MessagePattern('update_profile')
  updateProfile(@Payload() dto: UpdateProfileDto) {
    return this.authService.updateProfile(dto);
  }

  @MessagePattern(MSG_PATTERNS.AUTH.VALIDATE)
  @MessagePattern('validate_token')
  validateToken(@Payload() data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern('forgot-password')
  forgotPassword(@Payload() data: { email: string }) {
    return this.authService.forgotPassword(data.email);
  }

  @MessagePattern('reset-password')
  resetPassword(@Payload() data: { email: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(data.email, data.otp, data.newPassword);
  }
}
