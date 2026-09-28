import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hires')
export class Hire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  pickupLocation: string;

  @Column({ nullable: true })
  dropoffLocation: string;

  @Column({ type: 'float', default: 0 })
  fare: number;

  @Column({ nullable: true })
  vehicleType: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
