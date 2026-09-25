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

  @MessagePattern('login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern('auth.send-otp')
  sendOtp(@Payload() payload: any) {
    return this.authService.sendOtp(payload);
  }

  @MessagePattern('auth.verify-otp')
  verifyOtp(@Payload() payload: any) {
    return this.authService.verifyOtp(payload);
  }

  @MessagePattern('auth.create-password')
  createPassword(@Payload() payload: any) {
    return this.authService.createPassword(payload);
  }

  @MessagePattern('auth.forgot-password')
  forgotPassword(@Payload() payload: any) {
    return this.authService.forgotPassword(payload);
  }

  @MessagePattern('auth.reset-password')
  resetPassword(@Payload() payload: any) {
    return this.authService.resetPassword(payload);
  }

  @MessagePattern('auth.get-profile')
  getProfile(@Payload() payload: any) {
    return this.authService.getProfile(payload);
  }

  @MessagePattern('auth.update-profile')
  updateProfile(@Payload() payload: any) {
    return this.authService.updateProfile(payload);
  }

  @MessagePattern('admin.get-users')
  getAdminUsers(@Payload() payload: any) {
    return this.authService.getAdminUsers(payload?.role);
  }

  @MessagePattern('admin.get-customers')
  getAdminCustomers() {
    return this.authService.getAdminCustomers();
  }

  @MessagePattern('admin.get-merchants')
  getAdminMerchants() {
    return this.authService.getAdminMerchants();
  }

  @MessagePattern('admin.create-user')
  createAdminUser(@Payload() payload: any) {
    return this.authService.createAdminUser(payload);
  }

  @MessagePattern('admin.update-user')
  updateAdminUser(@Payload() payload: any) {
    return this.authService.updateAdminUser(payload.id, payload.data);
  }

  @MessagePattern('admin.delete-user')
  deleteAdminUser(@Payload() payload: any) {
    return this.authService.deleteAdminUser(payload.id);
  }
}
