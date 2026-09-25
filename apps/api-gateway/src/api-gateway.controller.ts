import { Controller, Get, Patch, Delete, Param, Body, Post, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common';
import { ApiGatewayService } from './api-gateway.service';

let mockRides: any[] = [
  { id: 'RIDE-8842', pickupAddress: 'Yaalu Central Hub', dropoffAddress: 'No 15, Galle Road', rideType: 'Delivery', createdAt: new Date().toISOString() }
];

@Controller()
export class ApiGatewayController {
  constructor(
    private readonly apiGatewayService: ApiGatewayService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  // ── Orders ──────────────────────────────────────────
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
      status: 'PENDING',
    };
    return this.authClient.send('orders.create', newOrder);
  }

  @Get('orders')
  getOrders() {
    return this.authClient.send('orders.find-all', {});
  }

  @Get('admin/orders')
  getAdminOrders() {
    return this.authClient.send('orders.find-all', {});
  }

  @Get('admin/users')
  getAdminUsers(@Query('role') role?: string) {
    return this.authClient.send('admin.get-users', { role });
  }

  @Post('admin/users')
  createAdminUser(@Body() body: any) {
    return this.authClient.send('admin.create-user', body);
  }

  @Delete('admin/users/:id')
  deleteAdminUser(@Param('id') id: string) {
    return this.authClient.send('admin.delete-user', { id });
  }

  @Patch('admin/users/:id')
  updateAdminUser(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('admin.update-user', { id, data: body });
  }

  @Get('admin/customers')
  getAdminCustomers() {
    return this.authClient.send('admin.get-customers', {});
  }

  @Get('admin/merchants')
  getAdminMerchants() {
    return this.authClient.send('admin.get-merchants', {});
  }

  @Patch('admin/merchants/:id/verify')
  verifyMerchant(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('admin.update-user', {
      id,
      data: { status: body.isVerified ? 'ACTIVE' : 'SUSPENDED' },
    });
  }

  @Patch('admin/merchants/:id/bank')
  updateMerchantBank(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('admin.update-user', { id, data: body });
  }

  @Patch('admin/merchants/:id')
  updateMerchant(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('admin.update-user', { id, data: body });
  }

  @Patch('admin/customers/:id')
  updateCustomer(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('admin.update-user', { id, data: body });
  }

  // ── Products ──────────────────────────────────────────
  @Get('products')
  getProducts(@Query('activeOnly') activeOnly: string) {
    return this.authClient.send('products.find-all', { activeOnly: activeOnly === 'true' });
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.authClient.send('products.find-one', { id });
  }

  @Post('products')
  createProduct(@Body() body: any) {
    return this.authClient.send('products.create', body);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('products.update', { id, data: body });
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.authClient.send('products.remove', { id });
  }

  // ── Admin Products Alias ──────────────────────────────────────────
  @Get('admin/products')
  getAdminProducts() {
    return this.authClient.send('products.find-all', { activeOnly: false });
  }

  @Post('admin/products')
  createAdminProduct(@Body() body: any) {
    return this.createProduct(body);
  }

  @Patch('admin/products/:id')
  updateAdminProduct(@Param('id') id: string, @Body() body: any) {
    return this.updateProduct(id, body);
  }

  @Delete('admin/products/:id')
  deleteAdminProduct(@Param('id') id: string) {
    return this.deleteProduct(id);
  }

  // ── Admin Invoices (in-memory) ──────────────────────────────────────────
  private mockInvoices: any[] = [];

  @Get('admin/invoices')
  getAdminInvoices() {
    return this.mockInvoices;
  }

  @Patch('admin/invoices/:id/pay')
  markInvoicePaid(@Param('id') id: string) {
    const idx = this.mockInvoices.findIndex(i => i.id === id);
    if (idx !== -1) { this.mockInvoices[idx].status = 'paid'; return this.mockInvoices[idx]; }
    return { success: true };
  }

  // ── Fare Settings (in-memory) ───────────────────────────────────────────
  private fareSettings: any = {
    vehicleType: 'THREE_WHEEL', baseFare: 100, perKmRate: 50, minimumFare: 150, isActive: true
  };

  @Get('admin/fare-settings')
  getFareSettings() {
    return [this.fareSettings];
  }

  @Patch('admin/fare-settings')
  updateFareSettings(@Body() body: any) {
    this.fareSettings = { ...this.fareSettings, ...body };
    return this.fareSettings;
  }

  @Post('admin/fare-settings/calculate')
  calculateFare(@Body() body: any) {
    return { ...this.fareSettings, calculatedFare: (body.distanceKm || 1) * (this.fareSettings.perKmRate || 50) };
  }

  // ── Hires (in-memory) ───────────────────────────────────────────────────
  private mockHires: any[] = [];

  @Get('admin/hires')
  getAdminHires() {
    return this.mockHires;
  }

  @Post('admin/hires')
  createAdminHire(@Body() body: any) {
    const hire = { ...body, id: 'HIRE-' + Date.now(), createdAt: new Date().toISOString() };
    this.mockHires.unshift(hire);
    return hire;
  }

  @Delete('admin/hires/:id')
  deleteAdminHire(@Param('id') id: string) {
    this.mockHires = this.mockHires.filter(h => h.id !== id);
    return { success: true };
  }

  @Get('admin/stats')
  async getAdminStats() {
    try {
      const customers: any = await this.authClient.send('admin.get-customers', {}).toPromise();
      const merchants: any = await this.authClient.send('admin.get-merchants', {}).toPromise();
      const orders: any = await this.authClient.send('orders.find-all', {}).toPromise();
      
      const totalCust = Array.isArray(customers) ? customers.length : 1;
      const totalMerch = Array.isArray(merchants) ? merchants.length : 1;
      const totalOrd = Array.isArray(orders) ? orders.length : 0;
      
      return {
        totalOrders: totalOrd,
        totalCustomers: totalCust,
        totalMerchants: totalMerch,
        totalRevenue: Array.isArray(orders) ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) : 0
      };
    } catch {
      return {
        totalOrders: 0,
        totalCustomers: 1,
        totalMerchants: 1,
        totalRevenue: 0
      };
    }
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.authClient.send('orders.find-one', { id });
  }

  @Patch('admin/orders/:id/status')
  updateAdminOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.updateOrderStatus(id, body);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    const res = await this.authClient.send('orders.update-status', { id, data: { status: body.status } }).toPromise();
    
    if (body.status === 'PREPARING' || body.status === 'READY') {
      mockRides.push({
        id: 'RIDE-' + Math.floor(Math.random() * 10000),
        pickupAddress: 'Shop Location',
        dropoffAddress: res?.deliveryAddress || 'Customer Delivery Address',
        rideType: 'Delivery',
        createdAt: new Date().toISOString()
      });
    }
    return { success: true, status: body.status, order: res };
  }

  @Get('deliveries/rides/available')
  getAvailableRides() {
    return mockRides;
  }
}
