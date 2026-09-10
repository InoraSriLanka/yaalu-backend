import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('riders')
export class Rider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Rider Partner' })
  fullName: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Index()
  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: '' })
  password: string;

  @Column({ nullable: true })
  nicNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'MOTORBIKE' })
  vehicleType: string;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseExpiry: string;

  @Column({ nullable: true })
  licenseFrontUrl: string;

  @Column({ nullable: true })
  licenseBackUrl: string;

  @Column({ nullable: true })
  profilePhotoUrl: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountHolder: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  branchCode: string;

  @Column({ type: 'int', default: 1 })
  registrationStep: number;

  @Column({ default: 'AVAILABLE' })
  status: string;

  @Column({ default: true })
  isApproved: boolean;

  @Column({ type: 'int', default: 0 })
  deliveriesCompleted: number;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ type: 'float', nullable: true })
  currentLatitude: number;

  @Column({ type: 'float', nullable: true })
  currentLongitude: number;

  @Column({ default: 'RIDER' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
