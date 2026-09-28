import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FareSettingsService } from './fare-settings.service';

@Controller()
export class FareSettingsController {
  constructor(private readonly fareSettingsService: FareSettingsService) {}

  @MessagePattern('fare-settings.find-all')
  findAll() {
    return this.fareSettingsService.findAll();
  }

  @MessagePattern('fare-settings.update')
  update(@Payload() payload: any) {
    return this.fareSettingsService.update(payload);
  }

  @MessagePattern('fare-settings.calculate')
  calculate(@Payload() payload: any) {
    return this.fareSettingsService.calculate(payload);
  }
}
