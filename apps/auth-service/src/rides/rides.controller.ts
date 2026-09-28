import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RidesService } from './rides.service';

@Controller()
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @MessagePattern('rides.find-all')
  findAll() {
    return this.ridesService.findAll();
  }

  @MessagePattern('rides.find-available')
  findAvailable() {
    return this.ridesService.findAvailable();
  }

  @MessagePattern('rides.create')
  create(@Payload() payload: any) {
    return this.ridesService.create(payload);
  }
}
