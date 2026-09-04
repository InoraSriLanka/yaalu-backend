import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '@app/auth-service/auth/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthProxyController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'User successfully created with JWT token' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('send-otp')
  sendOtp(@Body() body: { mobile?: string; phoneNumber?: string; email?: string }) {
    return this.authService.sendOtp({
      phoneNumber: body.phoneNumber || body.mobile,
      email: body.email,
    });
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { mobile?: string; target?: string; otp?: string; code?: string }) {
    return this.authService.verifyOtp({
      target: body.target || body.mobile || '',
      code: body.code || body.otp || '',
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Log into customer account' })
  @ApiResponse({ status: 200, description: 'Return JWT token and user profile' })
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

  @Post('create-password')
  createPassword(@Body() body: any) {
    return this.authService.createPassword(body);
  }
}
