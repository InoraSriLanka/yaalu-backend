import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ORDER_QUEUE } from '@app/common';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrderServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: ORDER_QUEUE,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  await app.listen();
}
bootstrap();
