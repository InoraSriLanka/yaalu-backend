import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride } from './entities/ride.entity';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private readonly ridesRepository: Repository<Ride>,
  ) {}

  async findAll() {
    return this.ridesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAvailable() {
    return this.ridesRepository.find({ where: { status: 'available' }, order: { createdAt: 'DESC' } });
  }

  async create(data: any) {
    const ride = this.ridesRepository.create({
      ...data,
      status: data.status || 'available',
    });
    return this.ridesRepository.save(ride);
  }
}
