import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HiresService } from './hires.service';

@Controller()
export class HiresController {
  constructor(private readonly hiresService: HiresService) {}

  @MessagePattern('hires.find-all')
  findAll() {
    return this.hiresService.findAll();
  }

  @MessagePattern('hires.create')
  create(@Payload() payload: any) {
    return this.hiresService.create(payload);
  }

  @MessagePattern('hires.remove')
  remove(@Payload() payload: { id: string }) {
    return this.hiresService.remove(payload.id);
  }
}
