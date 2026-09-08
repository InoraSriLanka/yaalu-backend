import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    return this.prisma.customerProfile.create({
      data: {
        userId: (dto as any).userId || (dto as any).id,
        fullName: (dto as any).name || (dto as any).fullName,
        phone: (dto as any).mobile || (dto as any).phone,
        deliveryAddress: (dto as any).address || (dto as any).deliveryAddress,
        notes: (dto as any).notes,
      },
    });
  }

  async findAll(merchantId?: string) {
    return this.prisma.customerProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id); // ensure exists
    return this.prisma.customerProfile.update({
      where: { id },
      data: {
        ...((dto as any).name !== undefined && { fullName: (dto as any).name }),
        ...((dto as any).fullName !== undefined && { fullName: (dto as any).fullName }),
        ...((dto as any).mobile !== undefined && { phone: (dto as any).mobile }),
        ...((dto as any).phone !== undefined && { phone: (dto as any).phone }),
        ...((dto as any).address !== undefined && { deliveryAddress: (dto as any).address }),
        ...((dto as any).deliveryAddress !== undefined && { deliveryAddress: (dto as any).deliveryAddress }),
        ...((dto as any).notes !== undefined && { notes: (dto as any).notes }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // ensure exists
    await this.prisma.customerProfile.delete({ where: { id } });
    return { deleted: true };
  }
}

