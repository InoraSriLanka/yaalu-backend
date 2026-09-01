import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { BookDeliveryDto } from './dto/book-delivery.dto';

@Injectable()
export class DeliveryServiceService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  async bookDelivery(dto: BookDeliveryDto): Promise<Delivery> {
    const delivery = this.deliveryRepository.create({
      ...dto,
      status: 'SEARCHING_DRIVER',
      driverName: 'Kavindu Perera',
      driverPhone: '+94771234567',
    });
    return this.deliveryRepository.save(delivery);
  }

  async getStatus(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id } });
    if (!delivery) {
      throw new NotFoundException(`Delivery/Ride with ID ${id} not found`);
    }
    return delivery;
  }
}
