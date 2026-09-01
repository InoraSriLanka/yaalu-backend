import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('product.create')
  create(@Payload() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @MessagePattern('product.findAll')
  findAll(@Payload() data: { merchantId: string; activeOnly?: boolean }) {
    return this.productsService.findAll(data.merchantId, data.activeOnly);
  }

  @MessagePattern('product.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.productsService.findOne(data.id);
  }

  @MessagePattern('product.update')
  update(@Payload() data: { id: string; dto: UpdateProductDto }) {
    return this.productsService.update(data.id, data.dto);
  }

  @MessagePattern('product.delete')
  remove(@Payload() data: { id: string }) {
    return this.productsService.remove(data.id);
  }
}
