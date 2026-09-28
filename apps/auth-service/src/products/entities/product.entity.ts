import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  merchantId: string;

  @Column({ nullable: true })
  merchantName: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'float', nullable: true })
  costPrice: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', nullable: true })
  lowStockThreshold: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
