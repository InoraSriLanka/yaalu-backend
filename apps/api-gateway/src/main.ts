import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // This is the only HTTP entrypoint of the system. Every request that needs
  // auth/product/order/etc. data is proxied from here to the relevant
  // microservice over RabbitMQ via an injected ClientProxy.
  // See src/auth/auth-proxy.controller.ts for an example of this pattern.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
