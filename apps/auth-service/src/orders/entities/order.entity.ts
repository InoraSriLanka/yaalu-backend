import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  merchantId: string;

  @Column({ nullable: true })
  merchantName: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  items: any;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  riderId: string;

  @Column({ nullable: true })
  riderName: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
