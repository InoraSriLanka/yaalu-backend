import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
  ) {}

  async findAll() {
    return this.invoicesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async markPaid(id: string) {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    invoice.status = 'paid';
    return this.invoicesRepository.save(invoice);
  }
}
