import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE } from '@app/common';

@Controller('customers')
export class CustomersProxyController {
  constructor(@Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    // TODO: Extract merchantId from JWT token
    return this.orderClient.send('customer.create', body);
  }

  @Get()
  findAll() {
    // TODO: Extract merchantId from JWT token
    return this.orderClient.send('customer.findAll', { merchantId: 'default' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderClient.send('customer.findOne', { id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.orderClient.send('customer.update', { id, dto: body });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderClient.send('customer.delete', { id });
  }
}
