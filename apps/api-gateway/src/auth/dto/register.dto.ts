import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+94770000000', required: false })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({ example: 'No. 123, Galle Road, Colombo 03', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'customer', default: 'customer', required: false })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ example: 'My Shop', required: false })
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiProperty({ example: 'No. 123, Galle Road, Colombo 03', required: false })
  @IsOptional()
  @IsString()
  shopAddress?: string;

  @ApiProperty({ example: 'REG123456', required: false })
  @IsOptional()
  @IsString()
  shopRegisterNumber?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ example: '199012345678', required: false })
  @IsOptional()
  @IsString()
  ownerIdNumber?: string;

  @ApiProperty({ example: 'Password123!', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
