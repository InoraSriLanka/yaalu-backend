import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: '+94771234567', description: 'Mobile number or target identifier' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ example: '0771234567', description: 'Mobile number alias' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: '+94771234567', description: 'Phone number alias' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Optional email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '123456', description: '6-digit OTP code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: '123456', description: '6-digit OTP code alias' })
  @IsOptional()
  @IsString()
  otp?: string;
}
