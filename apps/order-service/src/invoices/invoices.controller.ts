import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @MessagePattern('invoice.create')
  create(@Payload() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @MessagePattern('invoice.findAll')
  findAll(@Payload() data: { merchantId: string }) {
    return this.invoicesService.findAll(data.merchantId);
  }

  @MessagePattern('invoice.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.invoicesService.findOne(data.id);
  }

  @MessagePattern('invoice.markAsPaid')
  markAsPaid(@Payload() data: { id: string }) {
    return this.invoicesService.markAsPaid(data.id);
  }
}
