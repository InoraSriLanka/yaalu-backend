import { Body, Controller, Get, Inject, Patch, Post } from '@nestjs/common';
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

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authClient.send('login', dto);
  }

  @Post('send-otp')
  sendOtp(@Body() body: any) {
    return this.authClient.send('auth.send-otp', body);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: any) {
    return this.authClient.send('auth.verify-otp', body);
  }

  @Post('create-password')
  createPassword(@Body() body: any) {
    return this.authClient.send('auth.create-password', body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: any) {
    return this.authClient.send('auth.forgot-password', body);
  }

  @Post('reset-password')
  resetPassword(@Body() body: any) {
    return this.authClient.send('auth.reset-password', body);
  }

  @Post('admin-login')
  adminLogin(@Body() body: any) {
    return {
      accessToken: 'yaalu_admin_token_' + Date.now(),
      user: {
        id: 'admin-1',
        email: body.email || 'admin@yaalu.lk',
        role: 'ADMIN',
        name: 'Administrator',
      },
    };
  }

  @Get('profile')
  getProfile() {
    return this.authClient.send('auth.get-profile', {});
  }

  @Get('me')
  getMe() {
    return this.authClient.send('auth.get-profile', {});
  }

  @Patch('profile')
  updateProfile(@Body() body: any) {
    return this.authClient.send('auth.update-profile', body);
  }
}

@Controller('merchants')
export class MerchantsProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Get('me')
  getMerchantProfile() {
    return this.authClient.send('auth.get-profile', {});
  }

  @Patch('me')
  updateMerchantProfile(@Body() body: any) {
    return this.authClient.send('auth.update-profile', body);
  }

  @Get('me/shop')
  getMerchantShop() {
    return this.authClient.send('auth.get-profile', {});
  }

  @Patch('me/shop')
  updateMerchantShop(@Body() body: any) {
    return this.authClient.send('auth.update-profile', body);
  }
}
