import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { ProductsService } from '@app/product-service/products/products.service';

@Controller('shops')
export class ShopsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  async getShops() {
    const shopProfiles = await this.prisma.shopProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shopProfiles.map((s) => ({
      id: s.id,
      userId: s.userId,
      shopName: s.shopName,
      shopAddress: s.shopAddress || s.outletAddress || '',
      outletAddress: s.outletAddress || s.shopAddress || '',
      registrationNo: s.registrationNo,
      ownerName: s.ownerName,
      ownerEmail: s.ownerEmail || s.user?.email,
      ownerPhone: s.ownerPhone,
      businessType: s.businessType,
      shopImage: s.shopImage || s.bannerUrl || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
      bannerUrl: s.bannerUrl || s.shopImage || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
      logoUrl: s.logoUrl || null,
      createdAt: s.createdAt,
    }));
  }

  @Get(':id')
  async getShopById(@Param('id') id: string) {
    const shop = await this.prisma.shopProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!shop) {
      return null;
    }

    return {
      id: shop.id,
      userId: shop.userId,
      shopName: shop.shopName,
      shopAddress: shop.shopAddress || shop.outletAddress || '',
      outletAddress: shop.outletAddress || shop.shopAddress || '',
      registrationNo: shop.registrationNo,
      ownerName: shop.ownerName,
      ownerEmail: shop.ownerEmail || shop.user?.email,
      ownerPhone: shop.ownerPhone,
      businessType: shop.businessType,
      shopImage: shop.shopImage || shop.bannerUrl || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
      bannerUrl: shop.bannerUrl || shop.shopImage || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
      logoUrl: shop.logoUrl || null,
      createdAt: shop.createdAt,
    };
  }

  @Get(':id/products')
  async getShopProducts(@Param('id') id: string) {
    const shop = await this.prisma.shopProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });

    const merchantId = shop ? shop.userId : id;
    return this.productsService.findAll(merchantId, true);
  }
}
