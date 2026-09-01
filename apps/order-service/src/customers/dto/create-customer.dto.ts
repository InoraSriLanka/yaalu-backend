import { IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  merchantId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
