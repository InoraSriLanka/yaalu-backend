import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'login' })
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern({ cmd: 'get_rider_profile' })
  getRiderProfile(@Payload() data: { userId: string }) {
    return this.authService.getRiderProfile(data.userId);
  }

  @MessagePattern({ cmd: 'update_rider_profile' })
  updateRiderProfile(@Payload() data: { userId: string; [key: string]: any }) {
    const { userId, ...rest } = data;
    return this.authService.updateRiderProfile(userId, rest);
  }

  @MessagePattern({ cmd: 'update_rider_status' })
  updateRiderStatus(@Payload() data: { userId: string; status: string }) {
    return this.authService.updateRiderStatus(data.userId, data.status);
  }

  @MessagePattern({ cmd: 'update_rider_location' })
  updateRiderLocation(@Payload() data: { userId: string; latitude: number; longitude: number }) {
    return this.authService.updateRiderLocation(data.userId, data.latitude, data.longitude);
  }

  @MessagePattern({ cmd: 'get_bank_details' })
  getBankDetails(@Payload() data: { userId: string }) {
    return this.authService.getBankDetails(data.userId);
  }

  @MessagePattern({ cmd: 'update_bank_details' })
  updateBankDetails(@Payload() data: { userId: string; [key: string]: any }) {
    const { userId, ...rest } = data;
    return this.authService.updateBankDetails(userId, rest);
  }

  @MessagePattern({ cmd: 'get_available_orders' })
  getAvailableOrders(@Payload() data: { userId: string }) {
    return this.authService.getAvailableOrders(data.userId);
  }

  @MessagePattern({ cmd: 'get_rider_orders' })
  getRiderOrders(@Payload() data: { userId: string; status?: string }) {
    return this.authService.getRiderOrders(data.userId, data.status);
  }

  @MessagePattern({ cmd: 'accept_order' })
  acceptOrder(@Payload() data: { userId: string; orderId: string }) {
    return this.authService.acceptOrder(data.userId, data.orderId);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  updateOrderStatus(@Payload() data: { userId: string; orderId: string; status: string }) {
    return this.authService.updateOrderStatus(data.userId, data.orderId, data.status);
  }

  @MessagePattern({ cmd: 'get_rider_earnings' })
  getRiderEarnings(@Payload() data: { userId: string; period?: string }) {
    return this.authService.getRiderEarnings(data.userId, data.period);
  }

  @MessagePattern({ cmd: 'get_rider_notifications' })
  getRiderNotifications(@Payload() data: { userId: string }) {
    return this.authService.getRiderNotifications(data.userId);
  }
}
