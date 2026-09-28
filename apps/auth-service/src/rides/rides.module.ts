import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { Ride } from './entities/ride.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ride])],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}
