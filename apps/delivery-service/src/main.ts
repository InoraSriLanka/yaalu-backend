import { NestFactory } from '@nestjs/core';
import { DeliveryServiceModule } from './delivery-service.module';

async function bootstrap() {
  const app = await NestFactory.create(DeliveryServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
