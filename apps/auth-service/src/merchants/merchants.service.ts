import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    let shopProfile = await this.prisma.shopProfile.findUnique({
      where: { userId },
    });
    if (!shopProfile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        shopProfile = await this.createForUser(
          userId,
          'Merchant',
          undefined,
        );
      } else {
        throw new NotFoundException('Merchant profile not found');
      }
    }
    return {
      ...shopProfile,
      id: shopProfile.id,
      userId: shopProfile.userId,
      fullName: shopProfile.ownerName || '',
      mobile: shopProfile.ownerPhone,
      address: shopProfile.shopAddress || shopProfile.outletAddress,
      shop: shopProfile,
    };
  }

  async updateProfile(userId: string, dto: UpdateMerchantDto) {
    const profile = await this.prisma.shopProfile.upsert({
      where: { userId },
      create: {
        userId,
        shopName: 'My Shop',
        ownerName: dto.fullName || 'Merchant',
        ownerPhone: dto.mobile,
        shopAddress: dto.address,
        outletAddress: dto.address,
      },
      update: {
        ...(dto.fullName && { ownerName: dto.fullName }),
        ...(dto.mobile && { ownerPhone: dto.mobile }),
        ...(dto.address && { shopAddress: dto.address, outletAddress: dto.address }),
      },
    });
    return profile;
  }

  async getShop(userId: string) {
    let shop = await this.prisma.shopProfile.findUnique({
      where: { userId },
    });
    if (!shop) {
      shop = await this.prisma.shopProfile.create({
        data: {
          userId,
          shopName: 'My Shop',
        },
      });
    }
    return shop;
  }

  async updateShop(userId: string, dto: UpdateShopDto) {
    const shop = await this.getShop(userId);
    return this.prisma.shopProfile.update({
      where: { id: shop.id },
      data: dto as any,
    });
  }

  /**
   * Called by auth-service during registration to create the shop profile.
   */
  async createForUser(userId: string, fullName: string, mobile?: string, address?: string) {
    const existing = await this.prisma.shopProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.shopProfile.create({
      data: {
        userId,
        shopName: 'My Shop',
        ownerName: fullName || 'Merchant',
        ownerPhone: mobile,
        shopAddress: address,
        outletAddress: address,
      },
    });
  }
}

