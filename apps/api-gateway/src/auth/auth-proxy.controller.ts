import { Body, Controller, Inject, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const parseStatusCode = (err: any, defaultStatus: number): number => {
  if (typeof err?.statusCode === 'number') return err.statusCode;
  if (typeof err?.status === 'number') return err.status;
  if (typeof err?.response?.statusCode === 'number') return err.response.statusCode;
  if (typeof err?.status === 'string') {
    const parsed = parseInt(err.status, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultStatus;
};

const parseErrorMessage = (err: any, defaultMessage: string): string => {
  if (typeof err === 'string') return err;
  if (typeof err?.message === 'string' && err.message !== 'Internal server error') return err.message;
  if (typeof err?.response?.message === 'string') return err.response.message;
  if (typeof err?.error === 'string') return err.error;
  return defaultMessage;
};

@Controller('auth')
export class AuthProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      console.log('[AuthProxyController] sending register pattern to AUTH_SERVICE:', dto);
      return await firstValueFrom(this.authClient.send({ cmd: 'register' }, dto));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Registration failed');
      throw new HttpException(message, status);
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'login' }, dto));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.UNAUTHORIZED);
      const message = parseErrorMessage(err, 'Invalid email or password');
      throw new HttpException(message, status);
    }
  }
}
