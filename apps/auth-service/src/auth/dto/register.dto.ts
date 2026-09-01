import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  mobile: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
