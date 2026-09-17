import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiPropertyOptional({ example: '+94771234567', description: 'Target mobile phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '0771234567', description: 'Target mobile number alias' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Optional email address' })
  @IsOptional()
  @IsString()
  email?: string;
}
