import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvoicesService } from './invoices.service';

@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @MessagePattern('invoices.find-all')
  findAll() {
    return this.invoicesService.findAll();
  }

  @MessagePattern('invoices.mark-paid')
  markPaid(@Payload() payload: { id: string }) {
    return this.invoicesService.markPaid(payload.id);
  }
}
