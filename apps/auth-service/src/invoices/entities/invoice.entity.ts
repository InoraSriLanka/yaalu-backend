import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  merchantId: string;

  @Column({ nullable: true })
  merchantName: string;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'float', default: 0 })
  commissionAmount: number;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
