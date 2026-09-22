import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { OrdersService } from '@app/order-service/orders/orders.service';
import { OrderStatus } from '@prisma/client';

function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('orders')
export class OrdersProxyController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const callerId = extractUserId(req);
    // If body doesn't provide merchantId, fallback to callerId (backward compat)
    const merchantId = body.merchantId || callerId;
    // Set customerId to the caller if not already set by admin
    const customerId = body.customerId || callerId;
    return this.ordersService.create({ ...body, merchantId, customerId });
  }

  @Get('stats')
  getStats(@Req() req: any) {
    const merchantId = extractUserId(req);
    return this.ordersService.getStats(merchantId);
  }

  @Get()
  findAll(@Req() req: any, @Query('status') status?: string, @Query('customerId') qCustomerId?: string) {
    const callerId = extractUserId(req);
    // Support fetching orders for either a shop (merchantId) or a customer (customerId)
    const queryForCustomer = qCustomerId === callerId;
    return this.ordersService.findAll(queryForCustomer ? null : callerId, status, queryForCustomer ? callerId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status as OrderStatus);
  }
}
