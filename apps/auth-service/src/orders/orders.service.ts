import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async findAll() {
    return this.ordersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(createDto: any) {
    const order = this.ordersRepository.create({
      ...createDto,
      status: createDto.status || 'PENDING',
    });
    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, updateDto: any) {
    const order = await this.findOne(id);
    if (updateDto.status) {
      order.status = updateDto.status;
    }
    return this.ordersRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
    return { success: true };
  }
}
