import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
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
    const userFromHeader = extractUserId(req);
    const customerId = body.customerId || (userFromHeader !== 'default' ? userFromHeader : undefined);
    return this.ordersService.create({ ...body, customerId });
  }

  @Get('stats')
  getStats(@Req() req: any) {
    const merchantId = extractUserId(req);
    return this.ordersService.getStats(merchantId);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('customerId') queryCustomerId?: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const userFromHeader = extractUserId(req);
    const customerId = queryCustomerId || (userFromHeader !== 'default' ? userFromHeader : undefined);
    return this.ordersService.findAll(queryMerchantId, customerId, status);
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
