import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from '@app/common';

@Controller('products')
export class ProductsProxyController {
  constructor(@Inject(PRODUCT_SERVICE) private readonly productClient: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    // TODO: Extract merchantId from JWT token once auth guard is implemented
    return this.productClient.send('product.create', body);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    // TODO: Extract merchantId from JWT token
    return this.productClient.send('product.findAll', {
      merchantId: 'default',
      activeOnly: activeOnly === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productClient.send('product.findOne', { id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productClient.send('product.update', { id, dto: body });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productClient.send('product.delete', { id });
  }
}
