import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}

