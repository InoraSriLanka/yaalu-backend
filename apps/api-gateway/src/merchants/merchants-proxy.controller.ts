import { Body, Controller, Get, Inject, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common';

@Controller('merchants')
export class MerchantsProxyController {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  @Get('me')
  getProfile() {
    // TODO: Extract userId from JWT token
    return this.authClient.send('merchant.getProfile', { userId: 'default' });
  }

  @Patch('me')
  updateProfile(@Body() body: any) {
    // TODO: Extract userId from JWT token
    return this.authClient.send('merchant.updateProfile', { userId: 'default', dto: body });
  }

  @Get('me/shop')
  getShop() {
    // TODO: Extract userId from JWT token
    return this.authClient.send('merchant.getShop', { userId: 'default' });
  }

  @Patch('me/shop')
  updateShop(@Body() body: any) {
    // TODO: Extract userId from JWT token
    return this.authClient.send('merchant.updateShop', { userId: 'default', dto: body });
  }
}
