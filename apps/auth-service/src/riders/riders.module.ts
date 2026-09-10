import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rider } from './entities/rider.entity';
import { RidersService } from './riders.service';
import { RidersController } from './riders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rider])],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService],
})
export class RidersModule {}
