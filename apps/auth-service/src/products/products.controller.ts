import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('products.find-all')
  findAll(@Payload() payload: { activeOnly: boolean }) {
    return this.productsService.findAll(payload?.activeOnly);
  }

  @MessagePattern('products.find-one')
  findOne(@Payload() payload: { id: string }) {
    return this.productsService.findOne(payload.id);
  }

  @MessagePattern('products.create')
  create(@Payload() payload: any) {
    return this.productsService.create(payload);
  }

  @MessagePattern('products.update')
  update(@Payload() payload: { id: string; data: any }) {
    return this.productsService.update(payload.id, payload.data);
  }

  @MessagePattern('products.remove')
  remove(@Payload() payload: { id: string }) {
    return this.productsService.remove(payload.id);
  }
}
