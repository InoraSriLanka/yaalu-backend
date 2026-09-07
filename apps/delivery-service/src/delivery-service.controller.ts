import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeliveryServiceService } from './delivery-service.service';
import { BookDeliveryDto } from './dto/book-delivery.dto';
import { MSG_PATTERNS } from '@app/common';

@Controller()
export class DeliveryServiceController {
  constructor(private readonly deliveryService: DeliveryServiceService) {}

  @MessagePattern(MSG_PATTERNS.DELIVERY.BOOK)
  book(@Payload() dto: BookDeliveryDto) {
    return this.deliveryService.bookDelivery(dto);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.GET_STATUS)
  getStatus(@Payload() data: { id: string }) {
    return this.deliveryService.getStatus(data.id);
  }
}
