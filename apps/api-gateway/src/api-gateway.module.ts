import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  AUTH_QUEUE,
  PRODUCT_SERVICE,
  PRODUCT_QUEUE,
  ORDER_SERVICE,
  ORDER_QUEUE,
  DELIVERY_SERVICE,
  DELIVERY_QUEUE,
} from '@app/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthProxyController } from './auth/auth-proxy.controller';
import { ProductsProxyController } from './products/products-proxy.controller';
import { OrdersProxyController } from './orders/orders-proxy.controller';
import { DeliveriesProxyController } from './deliveries/deliveries-proxy.controller';
import { UploadModule } from './uploads/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UploadModule,
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: AUTH_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
      {
        name: PRODUCT_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: PRODUCT_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
      {
        name: ORDER_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: ORDER_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
      {
        name: DELIVERY_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue: DELIVERY_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [
    ApiGatewayController,
    AuthProxyController,
    ProductsProxyController,
    OrdersProxyController,
    DeliveriesProxyController,
  ],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
