import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@app/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthProxyController } from './auth/auth-proxy.controller';
import { ProductsProxyController } from './products/products-proxy.controller';
import { OrdersProxyController } from './orders/orders-proxy.controller';
import { CustomersProxyController } from './customers/customers-proxy.controller';
import { InvoicesProxyController } from './invoices/invoices-proxy.controller';
import { MerchantsProxyController } from './merchants/merchants-proxy.controller';
import { UploadController } from './upload/upload.controller';
import { AdminController } from './admin/admin.controller';
import { RidersProxyController } from './riders/riders-proxy.controller';
import { RidesGateway } from './rides/rides.gateway';

// Import services directly (monolith mode — no RabbitMQ needed)
import { AuthService } from '@app/auth-service/auth/auth.service';
import { SmsService } from '@app/auth-service/sms/sms.service';
import { MerchantsService } from '@app/auth-service/merchants/merchants.service';
import { ProductsService } from '@app/product-service/products/products.service';
import { OrdersService } from '@app/order-service/orders/orders.service';
import { CustomersService } from '@app/order-service/customers/customers.service';
import { InvoicesService } from '@app/order-service/invoices/invoices.service';
import { DeliveryServiceService } from '@app/delivery-service/delivery-service.service';
import { DeliveriesProxyController } from './deliveries/deliveries-proxy.controller';
import { ShopsController } from './shops/shops.controller';
import { CardsController } from './cards/cards.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
    AdminController,
    RidersProxyController,
    DeliveriesProxyController,
    ShopsController,
    CardsController,
  ],
  providers: [
    ApiGatewayService,
    AuthService,
    SmsService,
    MerchantsService,
    ProductsService,
    OrdersService,
    CustomersService,
    InvoicesService,
    DeliveryServiceService,
    RidesGateway, // 🔔 Real-time Socket.io Gateway
  ],
})
export class ApiGatewayModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
  ) {}

  /** Wire the RidesGateway into DeliveryServiceService after module init */
  onModuleInit() {
    const deliveryService = this.moduleRef.get(DeliveryServiceService, { strict: false });
    const ridesGateway = this.moduleRef.get(RidesGateway, { strict: false });
    if (deliveryService && ridesGateway) {
      deliveryService.setRidesGateway(ridesGateway);
    }
  }
}
