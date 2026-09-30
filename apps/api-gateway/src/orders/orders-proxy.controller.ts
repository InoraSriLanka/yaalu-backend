import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { OrdersService } from '@app/order-service/orders/orders.service';
import { OrderStatus } from '@prisma/client';
import { RidesGateway } from '../rides/rides.gateway';

function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('orders')
export class OrdersProxyController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ridesGateway: RidesGateway
  ) {}

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
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const updatedOrder = await this.ordersService.updateStatus(id, body.status as OrderStatus);
    
    if (body.status.toLowerCase() === 'confirmed') {
      const deliveryRequest = {
        id: updatedOrder.id,
        pickupAddress: 'Yaalu Shop (Kottawa)',
        dropoffAddress: updatedOrder.notes || updatedOrder.customerName || 'Customer Location',
        rideType: 'DELIVERY',
        selectedVehicleType: 'bike',
        finalFare: Number(updatedOrder.totalAmount),
        createdAt: updatedOrder.createdAt,
        pickupLat: 6.8412, // Kottawa latitude (mock since ShopProfile lacks coords)
        pickupLng: 79.9654  // Kottawa longitude
      };
      
      this.ridesGateway.broadcastNewHireRequest(deliveryRequest);
    }
    
    return updatedOrder;
  }
}
