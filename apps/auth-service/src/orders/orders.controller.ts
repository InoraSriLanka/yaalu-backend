import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('orders.find-all')
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern('orders.find-one')
  findOne(@Payload() payload: { id: string }) {
    return this.ordersService.findOne(payload.id);
  }

  @MessagePattern('orders.create')
  create(@Payload() payload: any) {
    return this.ordersService.create(payload);
  }

  @MessagePattern('orders.update-status')
  updateStatus(@Payload() payload: { id: string; data: any }) {
    return this.ordersService.updateStatus(payload.id, payload.data);
  }

  @MessagePattern('orders.remove')
  remove(@Payload() payload: { id: string }) {
    return this.ordersService.remove(payload.id);
  }
}
