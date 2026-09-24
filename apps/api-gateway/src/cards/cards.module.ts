import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/common';
import { CardsController } from './cards.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CardsController],
})
export class CardsModule {}
