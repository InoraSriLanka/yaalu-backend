import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    const count = await this.productRepository.count();
    if (count === 0) {
      const initialProducts = [
        {
          name: 'Red Apple 1kg',
          description: 'Freshly picked crisp red apples from Nuwara Eliya orchards',
          price: 650.0,
          category: 'Fruits',
          imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80',
          stock: 100,
          storeId: 'Green Mart',
        },
        {
          name: 'Banana 500g',
          description: 'Local sweet Cavendish bananas packed with natural energy',
          price: 280.0,
          category: 'Fruits',
          imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80',
          stock: 150,
          storeId: 'Green Mart',
        },
        {
          name: 'Broccoli 250g',
          description: 'Imported quality farm fresh broccoli rich in vitamins',
          price: 420.0,
          category: 'Vegetables',
          imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&auto=format&fit=crop&q=80',
          stock: 80,
          storeId: 'Fresh Basket',
        },
        {
          name: 'Fresh Milk 1L',
          description: 'Pure Highland pasteurized whole milk',
          price: 550.0,
          category: 'Dairy',
          imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80',
          stock: 120,
          storeId: 'Daily Picks',
        },
      ];
      await this.productRepository.save(initialProducts);
      console.log('🌱 Seeded default products into PostgreSQL yaalu_product DB');
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }
}
