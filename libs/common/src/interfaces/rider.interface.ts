export type RiderVehicleType = 'MOTORBIKE' | 'SCOOTER' | 'THREE_WHEEL' | 'CAR' | 'VAN';
export type RiderStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'PENDING' | 'SUSPENDED';

export interface IRider {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  nicNumber?: string;
  address?: string;
  city?: string;
  vehicleType: RiderVehicleType;
  vehicleNumber: string;
  vehicleModel?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  profilePhotoUrl?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  status: RiderStatus;
  isApproved: boolean;
  deliveriesCompleted: number;
  rating: number;
  currentLatitude?: number;
  currentLongitude?: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
