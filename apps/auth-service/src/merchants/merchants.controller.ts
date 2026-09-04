import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MerchantsService } from './merchants.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Controller()
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @MessagePattern('merchant.getProfile')
  getProfile(@Payload() data: { userId: string }) {
    return this.merchantsService.getProfile(data.userId);
  }

  @MessagePattern('merchant.updateProfile')
  updateProfile(@Payload() data: { userId: string; dto: UpdateMerchantDto }) {
    return this.merchantsService.updateProfile(data.userId, data.dto);
  }

  @MessagePattern('merchant.getShop')
  getShop(@Payload() data: { userId: string }) {
    return this.merchantsService.getShop(data.userId);
  }

  @MessagePattern('merchant.updateShop')
  updateShop(@Payload() data: { userId: string; dto: UpdateShopDto }) {
    return this.merchantsService.updateShop(data.userId, data.dto);
  }
}
