import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern('send-otp')
  sendOtp(@Payload() data: { mobile: string }) {
    return this.authService.sendOtp(data.mobile);
  }

  @MessagePattern('verify-otp')
  verifyOtp(@Payload() data: { mobile: string; otp: string }) {
    return this.authService.verifyOtp(data.mobile, data.otp);
  }

  @MessagePattern('login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
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
