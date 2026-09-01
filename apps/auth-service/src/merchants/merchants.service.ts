import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: { shop: true },
    });
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }
    return merchant;
  }

  async updateProfile(userId: string, dto: UpdateMerchantDto) {
    const merchant = await this.getProfile(userId);
    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: dto,
    });
  }

  async getShop(userId: string) {
    const merchant = await this.getProfile(userId);
    if (!merchant.shop) {
      // Auto-create an empty shop if it doesn't exist yet
      const shop = await this.prisma.shop.create({
        data: { merchantId: merchant.id },
      });
      return shop;
    }
    return merchant.shop;
  }

  async updateShop(userId: string, dto: UpdateShopDto) {
    const shop = await this.getShop(userId);
    return this.prisma.shop.update({
      where: { id: shop.id },
      data: dto,
    });
  }

  /**
   * Called by auth-service during registration to create the merchant profile.
   */
  async createForUser(userId: string, fullName: string, mobile?: string, address?: string) {
    const merchant = await this.prisma.merchant.create({
      data: { userId, fullName, mobile, address },
    });

    // Auto-create an empty shop for the merchant
    await this.prisma.shop.create({
      data: { merchantId: merchant.id },
    });

    return this.prisma.merchant.findUnique({
      where: { id: merchant.id },
      include: { shop: true },
    });
  }
}
