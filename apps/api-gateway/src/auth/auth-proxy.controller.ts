import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authClient.send('register', dto);
  }

  @Post('send-otp')
  sendOtp(@Body() body: { mobile: string }) {
    return this.authClient.send('send-otp', body);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { mobile: string; otp: string }) {
    return this.authClient.send('verify-otp', body);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authClient.send('login', dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authClient.send('forgot-password', body);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authClient.send('reset-password', body);
  }
}
