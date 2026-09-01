import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_SERVICE, AUTH_QUEUE,
  PRODUCT_SERVICE, PRODUCT_QUEUE,
  ORDER_SERVICE, ORDER_QUEUE,
} from '@app/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthProxyController } from './auth/auth-proxy.controller';
import { ProductsProxyController } from './products/products-proxy.controller';
import { OrdersProxyController } from './orders/orders-proxy.controller';
import { CustomersProxyController } from './customers/customers-proxy.controller';
import { InvoicesProxyController } from './invoices/invoices-proxy.controller';
import { MerchantsProxyController } from './merchants/merchants-proxy.controller';
import { UploadController } from './upload/upload.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    ]),
  ],
  controllers: [
    ApiGatewayController,
    AuthProxyController,
    ProductsProxyController,
    OrdersProxyController,
    CustomersProxyController,
    InvoicesProxyController,
    MerchantsProxyController,
    UploadController,
  ],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
