import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const items = dto.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));

    const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return this.prisma.order.create({
      data: {
        merchantId: dto.merchantId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        totalAmount,
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
  }

  async findAll(merchantId: string, status?: string) {
    const where: any = { merchantId };
    if (status && status.toLowerCase() !== 'all') {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      const normalized = status.toLowerCase();
      if (validStatuses.includes(normalized)) {
        where.status = normalized as OrderStatus;
      }
    }
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus | string) {
    await this.findOne(id); // ensure exists
    const normalized = (typeof status === 'string' ? status.toLowerCase() : status) as OrderStatus;
    return this.prisma.order.update({
      where: { id },
      data: { status: normalized },
      include: { items: true },
    });
  }

  async getStats(merchantId: string) {
    const orders = await this.prisma.order.findMany({ where: { merchantId } });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return { totalOrders, pendingOrders, deliveredOrders, totalRevenue };
  }
}
