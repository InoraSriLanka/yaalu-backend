import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FareSetting } from './entities/fare-setting.entity';

@Injectable()
export class FareSettingsService {
  constructor(
    @InjectRepository(FareSetting)
    private readonly fareRepo: Repository<FareSetting>,
  ) {}

  async findAll() {
    const settings = await this.fareRepo.find({ order: { createdAt: 'DESC' } });
    if (settings.length === 0) {
      // Seed default fare setting on first access
      const defaultSetting = this.fareRepo.create({
        vehicleType: 'THREE_WHEEL',
        baseFare: 100,
        perKmRate: 50,
        minimumFare: 150,
        isActive: true,
      });
      const saved = await this.fareRepo.save(defaultSetting);
      return [saved];
    }
    return settings;
  }

  async update(data: any) {
    let settings = await this.fareRepo.find({ order: { createdAt: 'DESC' } });
    let setting: FareSetting;
    if (settings.length === 0) {
      setting = this.fareRepo.create({
        vehicleType: 'THREE_WHEEL',
        baseFare: 100,
        perKmRate: 50,
        minimumFare: 150,
        isActive: true,
      });
    } else {
      setting = settings[0];
    }
    Object.assign(setting, data);
    return this.fareRepo.save(setting);
  }

  async calculate(data: { distanceKm?: number; vehicleType?: string }) {
    const settings = await this.findAll();
    const setting = settings[0];
    return {
      ...setting,
      calculatedFare: (data.distanceKm || 1) * (setting.perKmRate || 50),
    };
  }
}
