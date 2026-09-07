import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'user-id-uuid', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Firstname', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Lastname', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+94770000000', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '199012345678', required: false })
  @IsOptional()
  @IsString()
  nicNumber?: string;

  @ApiProperty({ example: 'Colombo 01', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({ example: 'No. 123, Galle Road, Colombo 03', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 6.9271, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 79.8612, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
