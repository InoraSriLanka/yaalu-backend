import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'customer' })
  role: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  nicNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ nullable: true })
  vehicleType: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  plateNumber: string;

  @Column({ nullable: true })
  vehiclePhoto: string;

  @Column({ nullable: true })
  registrationDoc: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseExpiryDate: string;

  @Column({ nullable: true })
  licenseFrontPhoto: string;

  @Column({ nullable: true })
  licenseBackPhoto: string;

  @Column({ nullable: true })
  policeClearanceDoc: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountHolder: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  branchCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
