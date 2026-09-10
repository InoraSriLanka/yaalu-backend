import { IsOptional, IsString } from 'class-validator';

export class RiderLoginDto {
  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  password: string;
}
