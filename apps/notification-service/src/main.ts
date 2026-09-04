import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NOTIFICATION_QUEUE } from '@app/common';
import { NotificationServiceModule } from './notification-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: NOTIFICATION_QUEUE,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  await app.listen();
}
bootstrap();
