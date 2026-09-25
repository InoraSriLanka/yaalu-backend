import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(activeOnly: boolean) {
    if (activeOnly) {
      return this.productsRepository.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    }
    return this.productsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(createDto: any) {
    const product = this.productsRepository.create({
      ...createDto,
      isActive: createDto.isActive ?? true,
    });
    return this.productsRepository.save(product);
  }

  async update(id: string, updateDto: any) {
    const product = await this.findOne(id);
    Object.assign(product, updateDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { success: true };
  }
}
