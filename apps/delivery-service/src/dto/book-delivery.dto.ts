import { IsString, IsNumber, Min } from 'class-validator';

export class BookDeliveryDto {
  @IsString()
  userId: string;

  @IsString()
  pickupLocation: string;

  @IsString()
  dropoffLocation: string;

  @IsNumber()
  @Min(0)
  estimatedFare: number;
}
