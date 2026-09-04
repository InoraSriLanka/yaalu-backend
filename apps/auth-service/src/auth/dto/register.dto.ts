import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  email: string;

  @IsString()
  mobile: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  shopName?: string;

  @IsString()
  @IsOptional()
  shopAddress?: string;

  @IsString()
  @IsOptional()
  shopRegisterNumber?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerIdNumber?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
