import { Controller, Get } from '@nestjs/common';
import { DeliveryServiceService } from './delivery-service.service';

@Controller()
export class DeliveryServiceController {
  constructor(private readonly deliveryServiceService: DeliveryServiceService) {}

  @Get()
  getHello(): string {
    return this.deliveryServiceService.getHello();
  }
}
