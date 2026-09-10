import { Module } from '@nestjs/common';
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
import { DeliveriesProxyController } from './deliveries/deliveries-proxy.controller';
import { UploadModule } from './uploads/upload.module';
import { ShopsModule } from './shops/shops.module';
import { CardsModule } from './cards/cards.module';

import { AuthService } from '@app/auth-service/auth/auth.service';
import { SmsService } from '@app/auth-service/sms/sms.service';
import { MerchantsService } from '@app/auth-service/merchants/merchants.service';
import { ProductsService } from '@app/product-service/products/products.service';
import { OrdersService } from '@app/order-service/orders/orders.service';
import { CustomersService } from '@app/order-service/customers/customers.service';
import { InvoicesService } from '@app/order-service/invoices/invoices.service';
import { DeliveryServiceService } from '@app/delivery-service/delivery-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UploadModule,
    ShopsModule,
    CardsModule,
  ],
  controllers: [
    ApiGatewayController,
    AuthProxyController,
    ProductsProxyController,
    OrdersProxyController,
    CustomersProxyController,
    InvoicesProxyController,
    MerchantsProxyController,
    DeliveriesProxyController,
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
  ],
})
export class ApiGatewayModule {}
