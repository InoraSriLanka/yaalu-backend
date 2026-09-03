import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors({ origin: '*', credentials: true });

  // Increase payload size limit to 50MB for Cloudinary base64 image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Setup Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Yaalu Backend API Gateway')
    .setDescription('HTTP Gateway forwarding requests to Yaalu microservices over RabbitMQ')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
