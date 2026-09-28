import { Controller, Get, Patch, Delete, Param, Body, Post, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '@app/common';
import { ApiGatewayService } from './api-gateway.service';

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

  // ── Orders (PostgreSQL) ──────────────────────────────────────────
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
      customerPhone: body.customerPhone || '',
      deliveryAddress: body.deliveryAddress || '',
      status: 'PENDING',
    };
    return this.authClient.send('orders.create', newOrder);
  }

  @Get('orders')
  getOrders() {
    return this.authClient.send('orders.find-all', {});
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.authClient.send('orders.find-one', { id });
  }

  @Get('admin/orders')
  getAdminOrders() {
    return this.authClient.send('orders.find-all', {});
  }

  @Patch('admin/orders/:id/status')
  updateAdminOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.updateOrderStatus(id, body);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    const res = await this.authClient.send('orders.update-status', { id, data: { status: body.status } }).toPromise();

    if (body.status === 'PREPARING' || body.status === 'READY') {
      // Create a ride record in PostgreSQL
      await this.authClient.send('rides.create', {
        pickupAddress: 'Shop Location',
        dropoffAddress: res?.deliveryAddress || 'Customer Delivery Address',
        rideType: 'Delivery',
        orderId: id,
      }).toPromise();
    }
    return { success: true, status: body.status, order: res };
  }

  // ── Users (PostgreSQL) ──────────────────────────────────────────
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

  // ── Customers (PostgreSQL) ──────────────────────────────────────
  @Get('admin/customers')
  getAdminCustomers() {
    return this.authClient.send('admin.get-customers', {});
  }

  @Patch('admin/customers/:id')
  updateCustomer(@Param('id') id: string, @Body() body: any) {
    return this.authClient.send('admin.update-user', { id, data: body });
  }

  // ── Merchants (PostgreSQL) ──────────────────────────────────────
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

  // ── Products (PostgreSQL) ──────────────────────────────────────
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

  // ── Invoices (PostgreSQL) ──────────────────────────────────────
  @Get('admin/invoices')
  getAdminInvoices() {
    return this.authClient.send('invoices.find-all', {});
  }

  @Patch('admin/invoices/:id/pay')
  markInvoicePaid(@Param('id') id: string) {
    return this.authClient.send('invoices.mark-paid', { id });
  }

  // ── Fare Settings (PostgreSQL) ─────────────────────────────────
  @Get('admin/fare-settings')
  getFareSettings() {
    return this.authClient.send('fare-settings.find-all', {});
  }

  @Patch('admin/fare-settings')
  updateFareSettings(@Body() body: any) {
    return this.authClient.send('fare-settings.update', body);
  }

  @Post('admin/fare-settings/calculate')
  calculateFare(@Body() body: any) {
    return this.authClient.send('fare-settings.calculate', body);
  }

  // ── Hires (PostgreSQL) ─────────────────────────────────────────
  @Get('admin/hires')
  getAdminHires() {
    return this.authClient.send('hires.find-all', {});
  }

  @Post('admin/hires')
  createAdminHire(@Body() body: any) {
    return this.authClient.send('hires.create', body);
  }

  @Delete('admin/hires/:id')
  deleteAdminHire(@Param('id') id: string) {
    return this.authClient.send('hires.remove', { id });
  }

  // ── Rides / Deliveries (PostgreSQL) ────────────────────────────
  @Get('deliveries/rides/available')
  getAvailableRides() {
    return this.authClient.send('rides.find-available', {});
  }

  // ── Stats (PostgreSQL aggregation) ─────────────────────────────
  @Get('admin/stats')
  async getAdminStats() {
    try {
      const [customers, merchants, orders]: any[] = await Promise.all([
        this.authClient.send('admin.get-customers', {}).toPromise(),
        this.authClient.send('admin.get-merchants', {}).toPromise(),
        this.authClient.send('orders.find-all', {}).toPromise(),
      ]);

      const totalCust = Array.isArray(customers) ? customers.length : 0;
      const totalMerch = Array.isArray(merchants) ? merchants.length : 0;
      const totalOrd = Array.isArray(orders) ? orders.length : 0;

      return {
        totalOrders: totalOrd,
        totalCustomers: totalCust,
        totalMerchants: totalMerch,
        totalRevenue: Array.isArray(orders) ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) : 0,
      };
    } catch {
      return {
        totalOrders: 0,
        totalCustomers: 0,
        totalMerchants: 0,
        totalRevenue: 0,
      };
    }
  }
}
