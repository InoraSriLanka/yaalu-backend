import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductServiceService } from './product-service.service';
import { CreateProductDto } from './dto/create-product.dto';
import { MSG_PATTERNS } from '@app/common';

@Controller()
export class ProductServiceController {
  constructor(private readonly productService: ProductServiceService) {}

  @MessagePattern(MSG_PATTERNS.PRODUCT.GET_ALL)
  findAll() {
    return this.productService.findAll();
  }

  @MessagePattern(MSG_PATTERNS.PRODUCT.GET_BY_ID)
  findOne(@Payload() data: { id: string }) {
    return this.productService.findOne(data.id);
  }

  @MessagePattern(MSG_PATTERNS.PRODUCT.CREATE)
  create(@Payload() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}
