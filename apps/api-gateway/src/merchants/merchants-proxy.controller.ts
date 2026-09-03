import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { MerchantsService } from '@app/auth-service/merchants/merchants.service';
import { PrismaService } from '@app/common';

/**
 * Extract userId from the dev token (format: "dev-token-{userId}").
 * In production this would verify a real JWT.
 */
function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('merchants')
export class MerchantsProxyController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveUserId(req: any): Promise<string> {
    const userId = extractUserId(req);
    if (userId !== 'default' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) return user.id;
    }
    const fallbackUser = await this.prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
    return fallbackUser?.id || userId;
  }

  @Get('me')
  async getProfile(@Req() req: any) {
    const userId = await this.resolveUserId(req);
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    try {
      const merchant = await this.merchantsService.getProfile(userId);
      return {
        ...merchant,
        shopName: merchant?.shop?.shopName || merchant?.shopName || '',
        businessAddress:
          merchant?.shop?.outletAddress ||
          merchant?.shop?.shopAddress ||
          merchant?.shopAddress ||
          '',
        email: user?.email,
        mobile: merchant?.ownerPhone || merchant?.mobile || '',
        contactNumber: merchant?.ownerPhone || merchant?.mobile || '',
        fullName: merchant?.ownerName || merchant?.fullName || '',
        address: merchant?.shopAddress || merchant?.outletAddress || '',
      };
    } catch {
      return {
        id: userId,
        userId: userId,
        email: user?.email,
        mobile: '',
        contactNumber: '',
        fullName: '',
        address: '',
        shopName: '',
        businessAddress: '',
      };
    }
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() body: any) {
    const userId = await this.resolveUserId(req);
    return this.merchantsService.updateProfile(userId, body);
  }

  @Get('me/shop')
  async getShop(@Req() req: any) {
    const userId = await this.resolveUserId(req);
    return this.merchantsService.getShop(userId);
  }

  @Patch('me/shop')
  async updateShop(@Req() req: any, @Body() body: any) {
    const userId = await this.resolveUserId(req);
    return this.merchantsService.updateShop(userId, body);
  }
}
