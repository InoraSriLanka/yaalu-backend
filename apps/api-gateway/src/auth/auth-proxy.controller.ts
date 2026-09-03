import { Body, Controller, HttpException, Inject, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE, MSG_PATTERNS } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  private async handleProxyCall<T>(pattern: string, payload: any): Promise<T> {
    try {
      return await firstValueFrom(this.authClient.send<T>(pattern, payload));
    } catch (err: any) {
      console.warn(`[AuthProxyController] Error for pattern ${pattern}:`, err);
      const message =
        err?.message || (typeof err === 'string' ? err : 'Authentication request failed. Please check your inputs.');
      const statusCode = err?.statusCode || err?.status || 400;
      throw new HttpException(message, statusCode);
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'User successfully created with JWT token' })
  register(@Body() dto: RegisterDto) {
    return this.handleProxyCall(MSG_PATTERNS.AUTH.REGISTER, dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log into customer account' })
  @ApiResponse({ status: 200, description: 'Return JWT token and user profile' })
  login(@Body() dto: LoginDto) {
    return this.handleProxyCall(MSG_PATTERNS.AUTH.LOGIN, dto);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer user profile details' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully in PostgreSQL' })
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.handleProxyCall(MSG_PATTERNS.AUTH.UPDATE_PROFILE, dto);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Dispatch real 6-digit OTP verification code' })
  @ApiResponse({ status: 200, description: 'OTP dispatched successfully' })
  sendOtp(@Body() body: { phoneNumber?: string; email?: string }) {
    return this.handleProxyCall(MSG_PATTERNS.AUTH.SEND_OTP, body);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify 6-digit OTP verification code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  verifyOtp(@Body() body: { target: string; code: string }) {
    return this.handleProxyCall(MSG_PATTERNS.AUTH.VERIFY_OTP, body);
  }
}
