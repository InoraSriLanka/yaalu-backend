import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductServiceController } from './product-service.controller';
import { ProductServiceService } from './product-service.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ProductServiceController],
  providers: [ProductServiceService],
})
export class ProductServiceModule {}

