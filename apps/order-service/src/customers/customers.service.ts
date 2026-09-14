import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    return { id: 'deprecated', ...dto };
  }

  async findAll(merchantId?: string) {
    const profiles = await this.prisma.customerProfile.findMany({
      include: { user: true }
    });
    return profiles.map(p => ({
      id: p.id,
      name: p.fullName || p.user?.fullName || '',
      mobile: p.phoneNumber,
      email: p.user?.email || '',
      address: p.deliveryAddress,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async findOne(id: string) {
    const p = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!p) {
      throw new NotFoundException('Customer not found');
    }
    return {
      id: p.id,
      name: p.fullName || p.user?.fullName || '',
      mobile: p.phoneNumber,
      email: p.user?.email || '',
      address: p.deliveryAddress,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    return this.findOne(id);
  }

  async remove(id: string) {
    return { message: 'Customer profile maintained via auth' };
  }
}
