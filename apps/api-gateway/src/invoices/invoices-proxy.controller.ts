import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE } from '@app/common';

@Controller('invoices')
export class InvoicesProxyController {
  constructor(@Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    // TODO: Extract merchantId from JWT token
    return this.orderClient.send('invoice.create', body);
  }

  @Get()
  findAll() {
    // TODO: Extract merchantId from JWT token
    return this.orderClient.send('invoice.findAll', { merchantId: 'default' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderClient.send('invoice.findOne', { id });
  }

  @Patch(':id/pay')
  markAsPaid(@Param('id') id: string) {
    return this.orderClient.send('invoice.markAsPaid', { id });
  }
}
