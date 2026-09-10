import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common';
import {
  RiderRegisterDto,
  RiderLoginDto,
  SendOtpDto,
  VerifyOtpDto,
  UpdateRiderDto,
  Step1Dto,
  Step2Dto,
  Step3Dto,
  Step4Dto,
  Step5Dto,
} from './dto/rider.dto';

@Controller('riders')
export class RidersProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  private extractIdentifier(authHeader?: string, tokenQuery?: string, phoneQuery?: string): string {
    if (phoneQuery) return phoneQuery;
    const raw = authHeader?.replace(/^Bearer\s+/i, '') || tokenQuery || '';
    if (raw.startsWith('rider_token_')) {
      try {
        const json = Buffer.from(raw.replace('rider_token_', ''), 'base64').toString('utf8');
        const parsed = JSON.parse(json);
        return parsed.id || parsed.phone || raw;
      } catch {
        return raw;
      }
    }
    return raw || 'current';
  }

  // ─── STEP 1 ───────────────────────────────────────────────────────────────
  @Post('register/step1')
  registerStep1(@Body() dto: Step1Dto) {
    return this.authClient.send('rider.register.step1', dto);
  }

  // ─── STEP 2 ───────────────────────────────────────────────────────────────
  @Post('register/step2')
  registerStep2(@Body() dto: Step2Dto) {
    return this.authClient.send('rider.register.step2', dto);
  }

  // ─── STEP 3 ───────────────────────────────────────────────────────────────
  @Post('register/step3')
  registerStep3(@Body() dto: Step3Dto) {
    return this.authClient.send('rider.register.step3', dto);
  }

  // ─── STEP 4 ───────────────────────────────────────────────────────────────
  @Post('register/step4')
  registerStep4(@Body() dto: Step4Dto) {
    return this.authClient.send('rider.register.step4', dto);
  }

  // ─── STEP 5 ───────────────────────────────────────────────────────────────
  @Post('register/step5')
  registerStep5(@Body() dto: Step5Dto) {
    return this.authClient.send('rider.register.step5', dto);
  }

  // ─── REGISTRATION STATUS ──────────────────────────────────────────────────
  @Get('register/status')
  getRegistrationStatus(@Query('phone') phone: string, @Query('mobile') mobile: string) {
    return this.authClient.send('rider.register.status', { phone: phone || mobile });
  }

  // ─── FULL REGISTER ────────────────────────────────────────────────────────
  @Post('register')
  register(@Body() dto: RiderRegisterDto) {
    return this.authClient.send('rider.register', dto);
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  @Post('login')
  login(@Body() dto: RiderLoginDto) {
    return this.authClient.send('rider.login', dto);
  }

  // ─── SEND OTP ─────────────────────────────────────────────────────────────
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authClient.send('rider.send-otp', dto);
  }

  // ─── VERIFY OTP ───────────────────────────────────────────────────────────
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authClient.send('rider.verify-otp', dto);
  }

  // ─── CREATE PASSWORD ──────────────────────────────────────────────────────
  @Post('create-password')
  createPassword(@Body() dto: RiderRegisterDto) {
    return this.authClient.send('rider.create-password', dto);
  }

  // ─── GET PROFILE ──────────────────────────────────────────────────────────
  @Get('me')
  getProfile(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
    @Query('phone') phoneQuery?: string,
  ) {
    const idOrPhone = this.extractIdentifier(authHeader, tokenQuery, phoneQuery);
    return this.authClient.send('rider.get-profile', { idOrPhone });
  }

  // ─── UPDATE PROFILE ───────────────────────────────────────────────────────
  @Patch('me')
  updateProfile(
    @Body() dto: UpdateRiderDto,
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
    @Query('phone') phoneQuery?: string,
  ) {
    const idOrPhone = this.extractIdentifier(authHeader, tokenQuery, phoneQuery);
    return this.authClient.send('rider.update-profile', { idOrPhone, dto });
  }

  // ─── SET STATUS ───────────────────────────────────────────────────────────
  @Patch('me/status')
  setStatus(
    @Body() body: { status: string },
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const idOrPhone = this.extractIdentifier(authHeader, tokenQuery);
    return this.authClient.send('rider.set-status', { idOrPhone, status: body.status });
  }

  // ─── UPDATE LOCATION ──────────────────────────────────────────────────────
  @Patch('me/location')
  updateLocation(
    @Body() body: { latitude: number; longitude: number },
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const idOrPhone = this.extractIdentifier(authHeader, tokenQuery);
    return this.authClient.send('rider.update-location', {
      idOrPhone,
      latitude: body.latitude,
      longitude: body.longitude,
    });
  }

  // ─── BANK DETAILS ─────────────────────────────────────────────────────────
  @Get('me/bank')
  getBankDetails(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const idOrPhone = this.extractIdentifier(authHeader, tokenQuery);
    return this.authClient.send('rider.get-profile', { idOrPhone });
  }

  @Patch('me/bank')
  updateBankDetails(
    @Body() dto: UpdateRiderDto,
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string,
  ) {
    const idOrPhone = this.extractIdentifier(authHeader, tokenQuery);
    return this.authClient.send('rider.update-profile', { idOrPhone, dto });
  }
}

@Controller('admin/riders')
export class AdminRidersProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Get()
  getAllRiders() {
    return this.authClient.send('admin.get-riders', {});
  }

  @Patch(':id/status')
  updateRiderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.authClient.send('admin.update-rider-status', { id, status: body.status });
  }

  @Patch(':id/approve')
  approveRider(@Param('id') id: string, @Body() body: { isApproved: boolean }) {
    return this.authClient.send('admin.approve-rider', { id, isApproved: body.isApproved });
  }

  @Patch(':id/bank')
  updateRiderBank(@Param('id') id: string, @Body() body: UpdateRiderDto) {
    return this.authClient.send('rider.update-profile', { idOrPhone: id, dto: body });
  }
}
