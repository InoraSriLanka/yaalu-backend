import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';

let mockRides: any[] = [
  { id: 'RIDE-8842', pickupAddress: 'Yaalu Central Hub', dropoffAddress: 'No 15, Galle Road', rideType: 'Delivery', createdAt: new Date().toISOString() }
];
let mockOrders: any[] = [
  {
    id: 'ORD-1023',
    _id: 'ORD-1023',
    status: 'PENDING',
    customerName: 'Tharindu Lakmal',
    customerPhone: '071 234 5678',
    deliveryAddress: 'No 15, Galle Road, Colombo 03',
    totalAmount: 4500,
    items: [
      { productName: 'Fried Rice', quantity: 2, unitPrice: 1500, subtotal: 3000 },
      { productName: 'Coca Cola', quantity: 1, unitPrice: 1500, subtotal: 1500 }
    ],
    createdAt: new Date().toISOString()
  }
];

const mockCustomers = [
  { id: 'CUST-1', name: 'Tharindu Lakmal', mobile: '0712345678', email: 'tharindu@test.com', status: 'ACTIVE', createdAt: new Date().toISOString() }
];

const mockMerchants = [
  { id: 'MERCH-1', shopName: 'Yaalu Central Hub', ownerName: 'Admin', mobile: '0770000000', status: 'ACTIVE', createdAt: new Date().toISOString() }
];

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  // Mock cross-app flow for orders
  @Post('orders')
  createOrder(@Body() body: any) {
    const items = (body.items || []).map((item: any) => ({
      ...item,
      subtotal: Number(item.quantity || 1) * Number(item.unitPrice || 0)
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const newOrder = {
      ...body,
      items,
      totalAmount: body.totalAmount || totalAmount,
      customerPhone: body.customerPhone || '077 123 4567',
      deliveryAddress: body.deliveryAddress || 'No 123, Main Street, Colombo',
      id: 'ORD-' + Math.floor(Math.random() * 10000),
      _id: 'ORD-' + Math.floor(Math.random() * 10000),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    mockOrders.unshift(newOrder);
    return newOrder;
  }

  @Get('orders')
  getOrders() {
    return mockOrders;
  }

  @Get('admin/orders')
  getAdminOrders() {
    return mockOrders;
  }

  @Get('admin/customers')
  getAdminCustomers() {
    return mockCustomers;
  }

  @Get('admin/merchants')
  getAdminMerchants() {
    return mockMerchants;
  }

  @Get('admin/stats')
  getAdminStats() {
    return {
      totalOrders: mockOrders.length,
      totalCustomers: mockCustomers.length,
      totalMerchants: mockMerchants.length,
      totalRevenue: mockOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return mockOrders.find(o => o.id === id || o._id === id);
  }

  @Patch('admin/orders/:id/status')
  updateAdminOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.updateOrderStatus(id, body);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    const order = mockOrders.find(o => o.id === id || o._id === id);
    if (order) {
      order.status = body.status;
    }
    
    if (body.status === 'PREPARING' || body.status === 'READY') {
      mockRides.push({
        id: 'RIDE-' + Math.floor(Math.random() * 10000),
        pickupAddress: 'Shop Location',
        dropoffAddress: order?.deliveryAddress || 'Customer Delivery Address',
        rideType: 'Delivery',
        createdAt: new Date().toISOString()
      });
    }
    return { success: true, status: body.status, order };
  }

  @Get('deliveries/rides/available')
  getAvailableRides() {
    return mockRides;
  }
}
