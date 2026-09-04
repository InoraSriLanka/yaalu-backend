import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('order.create')
  create(@Payload() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @MessagePattern('order.findAll')
  findAll(@Payload() data: { merchantId: string; status?: string }) {
    return this.ordersService.findAll(data.merchantId, data.status);
  }

  @MessagePattern('order.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.ordersService.findOne(data.id);
  }

  @MessagePattern('order.updateStatus')
  updateStatus(@Payload() data: { id: string; status: OrderStatus }) {
    return this.ordersService.updateStatus(data.id, data.status);
  }

  @MessagePattern('order.stats')
  getStats(@Payload() data: { merchantId: string }) {
    return this.ordersService.getStats(data.merchantId);
  }
}
