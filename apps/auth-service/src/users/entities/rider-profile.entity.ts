import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rider_profiles')
export class RiderProfile {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'profile_photo_url', nullable: true })
  profilePhotoUrl: string;

  @Column({ name: 'nic_number', nullable: true })
  nicNumber: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'vehicle_type' })
  vehicleType: string;

  @Column({ name: 'vehicle_number' })
  vehicleNumber: string;

  @Column({ name: 'vehicle_model', nullable: true })
  vehicleModel: string;

  @Column({ name: 'license_number' })
  licenseNumber: string;

  @Column({ name: 'license_expiry', nullable: true })
  licenseExpiry: string;

  @Column({ name: 'license_front_url', nullable: true })
  licenseFrontUrl: string;

  @Column({ name: 'license_back_url', nullable: true })
  licenseBackUrl: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'account_name', nullable: true })
  accountName: string;

  @Column({ name: 'account_no', nullable: true })
  accountNo: string;

  @Column({ name: 'account_branch', nullable: true })
  accountBranch: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({ name: 'deliveries_completed', default: 0 })
  deliveriesCompleted: number;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ name: 'current_latitude', type: 'float', nullable: true })
  currentLatitude: number;

  @Column({ name: 'current_longitude', type: 'float', nullable: true })
  currentLongitude: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
