import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RidersModule } from './riders/riders.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { HiresModule } from './hires/hires.module';
import { FareSettingsModule } from './fare-settings/fare-settings.module';
import { RidesModule } from './rides/rides.module';
import { User } from './users/entities/user.entity';
import { Rider } from './riders/entities/rider.entity';
import { Product } from './products/entities/product.entity';
import { Order } from './orders/entities/order.entity';
import { Invoice } from './invoices/entities/invoice.entity';
import { Hire } from './hires/entities/hire.entity';
import { FareSetting } from './fare-settings/entities/fare-setting.entity';
import { Ride } from './rides/entities/ride.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // Connects to Native PostgreSQL 18 on Windows — NOT Docker
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'yaalu_auth'),
        entities: [User, Rider, Product, Order, Invoice, Hire, FareSetting, Ride],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    AuthModule,
    RidersModule,
    ProductsModule,
    OrdersModule,
    InvoicesModule,
    HiresModule,
    FareSettingsModule,
    RidesModule,
  ],
})
export class AuthServiceModule {}
