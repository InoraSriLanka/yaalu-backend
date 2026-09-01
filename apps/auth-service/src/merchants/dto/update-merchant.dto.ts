import { IsString, IsOptional } from 'class-validator';

export class UpdateMerchantDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
