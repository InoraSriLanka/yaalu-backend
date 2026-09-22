import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRideRequestDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  pickupAddress: string;

  @IsString()
  @IsOptional()
  dropoffAddress: string;

  @IsNumber()
  @IsOptional()
  pickupLat?: number;

  @IsNumber()
  @IsOptional()
  pickupLng?: number;

  @IsNumber()
  @IsOptional()
  dropoffLat?: number;

  @IsNumber()
  @IsOptional()
  dropoffLng?: number;

  @IsString()
  @IsOptional()
  rideType?: 'STANDARD' | 'BIDDING';

  @IsString()
  @IsOptional()
  selectedVehicleType?: string;

  @IsString()
  @IsOptional()
  tripCategory?: string;
}

export class SubmitBidDto {
  @IsString()
  @IsOptional()
  rideRequestId: string;

  @IsString()
  @IsOptional()
  driverId: string;

  @IsString()
  @IsOptional()
  driverName: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  vehicleModel: string;

  @IsString()
  @IsOptional()
  vehicleNumber: string;

  @IsNumber()
  @IsOptional()
  proposedFare: number;
}

export class AcceptBidDto {
  @IsString()
  @IsOptional()
  rideRequestId: string;

  @IsString()
  @IsOptional()
  bidId: string;
}

export class VerifyPinDto {
  @IsString()
  @IsOptional()
  rideRequestId: string;

  @IsString()
  @IsOptional()
  pin: string;
}

export class SubmitFeedbackDto {
  @IsString()
  @IsOptional()
  rideRequestId: string;

  @IsString()
  @IsOptional()
  customerId: string;

  @IsString()
  @IsOptional()
  driverId?: string;

  @IsNumber()
  @IsOptional()
  rating: number;

  @IsOptional()
  compliments?: string[];

  @IsString()
  @IsOptional()
  comment?: string;

  @IsNumber()
  @IsOptional()
  tipAmount?: number;
}
