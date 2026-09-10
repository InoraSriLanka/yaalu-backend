import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RidersService } from './riders.service';
import {
  RiderRegisterDto,
  Step1Dto,
  Step2Dto,
  Step3Dto,
  Step4Dto,
  Step5Dto,
} from './dto/rider-register.dto';
import { RiderLoginDto } from './dto/rider-login.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { UpdateRiderDto } from './dto/update-rider.dto';

@Controller()
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @MessagePattern('rider.register')
  register(@Payload() dto: RiderRegisterDto) {
    return this.ridersService.register(dto);
  }

  @MessagePattern('rider.register.step1')
  registerStep1(@Payload() dto: Step1Dto) {
    return this.ridersService.registerStep1(dto);
  }

  @MessagePattern('rider.register.step2')
  registerStep2(@Payload() dto: Step2Dto) {
    return this.ridersService.registerStep2(dto);
  }

  @MessagePattern('rider.register.step3')
  registerStep3(@Payload() dto: Step3Dto) {
    return this.ridersService.registerStep3(dto);
  }

  @MessagePattern('rider.register.step4')
  registerStep4(@Payload() dto: Step4Dto) {
    return this.ridersService.registerStep4(dto);
  }

  @MessagePattern('rider.register.step5')
  registerStep5(@Payload() dto: Step5Dto) {
    return this.ridersService.registerStep5(dto);
  }

  @MessagePattern('rider.register.status')
  getRegistrationStatus(@Payload() data: { phone: string }) {
    return this.ridersService.getRegistrationStatus(data.phone);
  }

  @MessagePattern('rider.login')
  login(@Payload() dto: RiderLoginDto) {
    return this.ridersService.login(dto);
  }

  @MessagePattern('rider.send-otp')
  sendOtp(@Payload() dto: SendOtpDto) {
    return this.ridersService.sendOtp(dto);
  }

  @MessagePattern('rider.verify-otp')
  verifyOtp(@Payload() dto: VerifyOtpDto) {
    return this.ridersService.verifyOtp(dto);
  }

  @MessagePattern('rider.create-password')
  createPassword(@Payload() dto: RiderRegisterDto) {
    return this.ridersService.register(dto);
  }

  @MessagePattern('rider.get-profile')
  getProfile(@Payload() data: { idOrPhone: string }) {
    return this.ridersService.getProfile(data.idOrPhone);
  }

  @MessagePattern('rider.update-profile')
  updateProfile(@Payload() data: { idOrPhone: string; dto: UpdateRiderDto }) {
    return this.ridersService.updateProfile(data.idOrPhone, data.dto);
  }

  @MessagePattern('rider.set-status')
  setStatus(@Payload() data: { idOrPhone: string; status: string }) {
    return this.ridersService.setStatus(data.idOrPhone, data.status);
  }

  @MessagePattern('rider.update-location')
  updateLocation(@Payload() data: { idOrPhone: string; latitude: number; longitude: number }) {
    return this.ridersService.updateLocation(data.idOrPhone, data.latitude, data.longitude);
  }

  @MessagePattern('admin.get-riders')
  getAllRiders() {
    return this.ridersService.getAllRiders();
  }

  @MessagePattern('admin.approve-rider')
  approveRider(@Payload() data: { id: string; isApproved: boolean }) {
    return this.ridersService.approveRider(data.id, data.isApproved);
  }

  @MessagePattern('admin.update-rider-status')
  updateRiderStatus(@Payload() data: { id: string; status: string }) {
    return this.ridersService.setStatus(data.id, data.status);
  }
}
