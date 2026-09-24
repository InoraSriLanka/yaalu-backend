import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeliveryServiceController } from './delivery-service.controller';
import { DeliveryServiceService } from './delivery-service.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [DeliveryServiceController],
  providers: [DeliveryServiceService],
})
export class DeliveryServiceModule {}

