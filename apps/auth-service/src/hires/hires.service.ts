import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hire } from './entities/hire.entity';

@Injectable()
export class HiresService {
  constructor(
    @InjectRepository(Hire)
    private readonly hiresRepository: Repository<Hire>,
  ) {}

  async findAll() {
    return this.hiresRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(data: any) {
    const hire = this.hiresRepository.create(data);
    return this.hiresRepository.save(hire);
  }

  async remove(id: string) {
    const hire = await this.hiresRepository.findOne({ where: { id } });
    if (!hire) throw new NotFoundException('Hire not found');
    await this.hiresRepository.remove(hire);
    return { success: true };
  }
}
