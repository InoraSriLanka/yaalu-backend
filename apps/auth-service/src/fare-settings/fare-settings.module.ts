import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FareSettingsService } from './fare-settings.service';
import { FareSettingsController } from './fare-settings.controller';
import { FareSetting } from './entities/fare-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FareSetting])],
  controllers: [FareSettingsController],
  providers: [FareSettingsService],
})
export class FareSettingsModule {}
