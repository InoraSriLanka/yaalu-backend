import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE, AUTH_QUEUE } from '@app/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthProxyController } from './auth/auth-proxy.controller';

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
    ]),
  ],
  controllers: [ApiGatewayController, AuthProxyController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
