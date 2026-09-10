import { IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  otp: string;
}
