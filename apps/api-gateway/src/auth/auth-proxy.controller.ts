import { Body, Controller, Inject, Post, Get, Patch, Param, Query, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const parseStatusCode = (err: any, defaultStatus: number): number => {
  if (typeof err?.statusCode === 'number') return err.statusCode;
  if (typeof err?.status === 'number') return err.status;
  if (typeof err?.response?.statusCode === 'number') return err.response.statusCode;
  return defaultStatus;
};

const parseErrorMessage = (err: any, defaultMessage: string): string => {
  if (typeof err === 'string') return err;
  if (typeof err?.message === 'string' && err.message !== 'Internal server error') return err.message;
  return defaultMessage;
};

const extractUserIdFromToken = (token?: string, authHeader?: string): string => {
  const raw = token || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : '');
  if (!raw) return '';
  return raw.replace(/^token_/i, '').trim();
};

@Controller()
export class AuthProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'register' }, dto));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Registration failed');
      throw new HttpException(message, status);
    }
  }

  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'login' }, dto));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.UNAUTHORIZED);
      const message = parseErrorMessage(err, 'Invalid email or password');
      throw new HttpException(message, status);
    }
  }

  @Get('riders/me')
  async getRiderProfile(@Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'get_rider_profile' }, { userId }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.UNAUTHORIZED);
      const message = parseErrorMessage(err, 'Failed to fetch rider profile');
      throw new HttpException(message, status);
    }
  }

  @Patch('riders/me')
  async updateRiderProfile(@Body() body: any, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'update_rider_profile' }, { userId, ...body }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to update rider profile');
      throw new HttpException(message, status);
    }
  }

  @Patch('riders/me/status')
  async updateRiderStatus(@Body() body: { status: string }, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'update_rider_status' }, { userId, status: body.status || 'AVAILABLE' }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to update rider status');
      throw new HttpException(message, status);
    }
  }

  @Patch('riders/me/location')
  async updateRiderLocation(@Body() body: { latitude: number; longitude: number }, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'update_rider_location' }, { userId, latitude: body.latitude, longitude: body.longitude }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to update rider location');
      throw new HttpException(message, status);
    }
  }

  @Get('riders/me/bank')
  async getBankDetails(@Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'get_bank_details' }, { userId }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to fetch bank details');
      throw new HttpException(message, status);
    }
  }

  @Patch('riders/me/bank')
  async updateBankDetails(@Body() body: any, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'update_bank_details' }, { userId, ...body }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to update bank details');
      throw new HttpException(message, status);
    }
  }

  @Get('riders/orders/available')
  async getAvailableOrders(@Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'get_available_orders' }, { userId }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to fetch available orders');
      throw new HttpException(message, status);
    }
  }

  @Get('riders/me/orders')
  async getRiderOrders(@Query('status') statusFilter?: string, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'get_rider_orders' }, { userId, status: statusFilter }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to fetch rider orders');
      throw new HttpException(message, status);
    }
  }

  @Patch('riders/orders/:id/accept')
  async acceptOrder(@Param('id') id: string, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'accept_order' }, { userId, orderId: id }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to accept order');
      throw new HttpException(message, status);
    }
  }

  @Patch('riders/orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'update_order_status' }, { userId, orderId: id, status: body.status }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to update order status');
      throw new HttpException(message, status);
    }
  }

  @Get('riders/me/earnings')
  async getRiderEarnings(@Query('period') period?: string, @Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'get_rider_earnings' }, { userId, period }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to fetch rider earnings');
      throw new HttpException(message, status);
    }
  }

  @Get('riders/me/notifications')
  async getRiderNotifications(@Query('token') token?: string, @Headers('authorization') authHeader?: string) {
    const userId = extractUserIdFromToken(token, authHeader);
    try {
      return await firstValueFrom(this.authClient.send({ cmd: 'get_rider_notifications' }, { userId }));
    } catch (err: any) {
      const status = parseStatusCode(err, HttpStatus.BAD_REQUEST);
      const message = parseErrorMessage(err, 'Failed to fetch rider notifications');
      throw new HttpException(message, status);
    }
  }
}
