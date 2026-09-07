import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ProductsService } from '@app/product-service/products/products.service';

function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('products')
export class ProductsProxyController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const merchantId = extractUserId(req);
    return this.productsService.create({ ...body, merchantId });
  }

  @Get()
  findAll(@Req() req: any, @Query('activeOnly') activeOnly?: string) {
    const merchantId = extractUserId(req);
    return this.productsService.findAll(merchantId, activeOnly === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
