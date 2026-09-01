import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MSG_PATTERNS } from '@app/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MSG_PATTERNS.AUTH.REGISTER)
  @MessagePattern('register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern(MSG_PATTERNS.AUTH.LOGIN)
  @MessagePattern('login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(MSG_PATTERNS.AUTH.UPDATE_PROFILE)
  @MessagePattern('update_profile')
  updateProfile(@Payload() dto: UpdateProfileDto) {
    return this.authService.updateProfile(dto);
  }

  @MessagePattern(MSG_PATTERNS.AUTH.VALIDATE)
  @MessagePattern('validate_token')
  validateToken(@Payload() data: { token: string }) {
    return this.authService.validateToken(data.token);
  }
}
