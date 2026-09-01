import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderServiceService } from './order-service.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MSG_PATTERNS } from '@app/common';

@Controller()
export class OrderServiceController {
  constructor(private readonly orderService: OrderServiceService) {}

  @MessagePattern(MSG_PATTERNS.ORDER.CREATE)
  create(@Payload() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @MessagePattern(MSG_PATTERNS.ORDER.GET_BY_USER)
  findByUser(@Payload() data: { userId: string }) {
    return this.orderService.findByUser(data.userId);
  }

  @MessagePattern(MSG_PATTERNS.ORDER.GET_BY_ID)
  findOne(@Payload() data: { id: string }) {
    return this.orderService.findOne(data.id);
  }
}
