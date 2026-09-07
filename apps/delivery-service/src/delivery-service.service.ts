import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { BookDeliveryDto } from './dto/book-delivery.dto';

@Injectable()
export class DeliveryServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async bookDelivery(dto: BookDeliveryDto) {
    return {
      success: true,
      message: 'Delivery booked successfully',
      delivery: {
        id: `del-${Date.now()}`,
        status: 'PENDING',
        ...dto,
      },
    };
  }

  async getStatus(id: string) {
    return {
      id,
      status: 'IN_TRANSIT',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000),
    };
  }
}
