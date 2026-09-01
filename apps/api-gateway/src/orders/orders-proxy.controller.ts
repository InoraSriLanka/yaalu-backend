import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE } from '@app/common';

@Controller('orders')
export class OrdersProxyController {
  constructor(@Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    // TODO: Extract merchantId from JWT token once auth guard is implemented
    return this.orderClient.send('order.create', body);
  }

  @Get('stats')
  getStats() {
    // TODO: Extract merchantId from JWT token
    return this.orderClient.send('order.stats', { merchantId: 'default' });
  }

  @Get()
  findAll(@Query('status') status?: string) {
    // TODO: Extract merchantId from JWT token
    return this.orderClient.send('order.findAll', { merchantId: 'default', status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderClient.send('order.findOne', { id });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orderClient.send('order.updateStatus', { id, status: body.status });
  }
}
