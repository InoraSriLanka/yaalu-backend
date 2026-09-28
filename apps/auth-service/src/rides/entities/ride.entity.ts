import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  pickupAddress: string;

  @Column({ nullable: true })
  dropoffAddress: string;

  @Column({ nullable: true })
  rideType: string;

  @Column({ nullable: true })
  riderId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ default: 'available' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
