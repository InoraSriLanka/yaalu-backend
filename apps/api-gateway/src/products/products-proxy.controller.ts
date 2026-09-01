import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PRODUCT_SERVICE, MSG_PATTERNS } from '@app/common';

@ApiTags('Products')
@Controller('products')
export class ProductsProxyController {
  constructor(@Inject(PRODUCT_SERVICE) private readonly productClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'Get list of all catalog products' })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll() {
    return this.productClient.send(MSG_PATTERNS.PRODUCT.GET_ALL, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product details by ID' })
  findOne(@Param('id') id: string) {
    return this.productClient.send(MSG_PATTERNS.PRODUCT.GET_BY_ID, { id });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product (Store/Vendor action)' })
  create(@Body() dto: any) {
    return this.productClient.send(MSG_PATTERNS.PRODUCT.CREATE, dto);
  }
}
