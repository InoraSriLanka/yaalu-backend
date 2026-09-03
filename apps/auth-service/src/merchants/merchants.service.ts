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
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        return this.createForUser(
          userId,
          user.fullName || 'Merchant',
          user.mobile || undefined,
          user.address || undefined,
        );
      }
      throw new NotFoundException('Merchant profile not found');
    }
    return merchant;
  }

  async updateProfile(userId: string, dto: UpdateMerchantDto) {
    const merchant = await this.getProfile(userId);
    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: dto,
    });
    if (dto.fullName || dto.address) {
      await this.prisma.user
        .update({
          where: { id: userId },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName } : {}),
            ...(dto.address ? { address: dto.address } : {}),
          },
        })
        .catch(() => {});
    }
    return updated;
  }

  async getShop(userId: string) {
    const merchant = await this.getProfile(userId);
    if (!merchant.shop) {
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
    const existing = await this.prisma.merchant.findUnique({
      where: { userId },
      include: { shop: true },
    });
    if (existing) {
      return existing;
    }

    const created = await this.prisma.merchant.create({
      data: { userId, fullName: fullName || 'Merchant', mobile, address },
    });

    // Auto-create an empty shop for the merchant
    await this.prisma.shop
      .create({
        data: { merchantId: created.id },
      })
      .catch(() => {});

    const result = await this.prisma.merchant.findUnique({
      where: { id: created.id },
      include: { shop: true },
    });

    if (!result) {
      throw new NotFoundException('Failed to create merchant profile');
    }

    return result;
  }
}
