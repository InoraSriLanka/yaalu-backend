import { IsOptional, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  otp?: string;
}
