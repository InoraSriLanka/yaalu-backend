import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '@app/auth-service/auth/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthProxyController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('send-otp')
  sendOtp(@Body() body: { mobile: string }) {
    return this.authService.sendOtp(body.mobile);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { mobile: string; otp: string }) {
    return this.authService.verifyOtp(body.mobile, body.otp);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }
}
