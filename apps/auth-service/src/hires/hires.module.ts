import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HiresService } from './hires.service';
import { HiresController } from './hires.controller';
import { Hire } from './entities/hire.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hire])],
  controllers: [HiresController],
  providers: [HiresService],
})
export class HiresModule {}
