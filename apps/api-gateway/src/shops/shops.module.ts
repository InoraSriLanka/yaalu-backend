import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { PrismaService } from '@app/common';
import { ProductsService } from '@app/product-service/products/products.service';

@Module({
  controllers: [ShopsController],
  providers: [PrismaService, ProductsService],
})
export class ShopsModule {}
