import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateShopDto {
  // ─── Merchant Info ──────────────────────────────────
  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  merchantType?: string;

  @IsString()
  @IsOptional()
  shopName?: string;

  @IsString()
  @IsOptional()
  outletAddress?: string;

  @IsString()
  @IsOptional()
  city?: string;

  // ─── Contact Info ──────────────────────────────────
  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsString()
  @IsOptional()
  managerPhone?: string;

  @IsString()
  @IsOptional()
  managerEmail?: string;

  @IsString()
  @IsOptional()
  openTime?: string;

  @IsString()
  @IsOptional()
  closeTime?: string;

  @IsString()
  @IsOptional()
  workingDays?: string;

  // ─── Business Info ──────────────────────────────────
  @IsString()
  @IsOptional()
  businessType?: string;

  @IsBoolean()
  @IsOptional()
  isBusinessRegistered?: boolean;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  registrationNo?: string;

  @IsBoolean()
  @IsOptional()
  isTaxRegistered?: boolean;

  @IsString()
  @IsOptional()
  tinNumber?: string;

  @IsBoolean()
  @IsOptional()
  isVatRegistered?: boolean;

  @IsString()
  @IsOptional()
  vatNumber?: string;

  @IsString()
  @IsOptional()
  businessAddress?: string;

  @IsString()
  @IsOptional()
  businessEmail?: string;

  // ─── Bank Details ──────────────────────────────────
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  accountNo?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  // ─── Shop Branding ──────────────────────────────────
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSubmitted?: boolean;
}
