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

  @MessagePattern({ cmd: 'update_rider_status' })
  updateRiderStatus(@Payload() data: { userId: string; status: string }) {
    return this.authService.updateRiderStatus(data.userId, data.status);
  }

  @MessagePattern({ cmd: 'update_rider_location' })
  updateRiderLocation(@Payload() data: { userId: string; latitude: number; longitude: number }) {
    return this.authService.updateRiderLocation(data.userId, data.latitude, data.longitude);
  }
}
