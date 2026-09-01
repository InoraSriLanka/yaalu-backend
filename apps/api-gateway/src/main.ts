import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiGatewayModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Serve uploaded files as static assets at /uploads/*
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // This is the only HTTP entrypoint of the system. Every request that needs
  // auth/product/order/etc. data is proxied from here to the relevant
  // microservice over RabbitMQ via an injected ClientProxy.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
