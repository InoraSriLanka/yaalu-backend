import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fare_settings')
export class FareSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'THREE_WHEEL' })
  vehicleType: string;

  @Column({ type: 'float', default: 100 })
  baseFare: number;

  @Column({ type: 'float', default: 50 })
  perKmRate: number;

  @Column({ type: 'float', default: 150 })
  minimumFare: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
