import { Body, Controller, Get, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '@app/auth-service/auth/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  @ApiOperation({ summary: 'Send 6-digit OTP code to mobile phone or email' })
  @ApiResponse({ status: 200, description: 'OTP generated and dispatched' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp({
      phoneNumber: dto.phoneNumber || dto.mobile,
      email: dto.email,
    });
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify 6-digit mobile phone OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully and access token issued' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp({
      target: dto.target || dto.mobile || dto.phoneNumber || dto.email || '',
      code: dto.code || dto.otp || '',
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

    @Get('profile')
  getProfile(@Query() query: any) {
    return this.authService.updateProfile(query);
  }

  @Patch('profile')
  updateProfilePatch(@Body() dto: UpdateProfileDto, @Query() query: any) {
    return this.authService.updateProfile({ ...query, ...dto });
  }

  @Put('profile')
  updateProfilePut(@Body() dto: UpdateProfileDto, @Query() query: any) {
    return this.authService.updateProfile({ ...query, ...dto });
  }

  @Post('profile')
  updateProfilePost(@Body() dto: UpdateProfileDto, @Query() query: any) {
    return this.authService.updateProfile({ ...query, ...dto });
  }
}
