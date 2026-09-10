import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { PrismaService } from '@app/common';

function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('cards')
export class CardsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async createCard(@Req() req: any, @Body() body: any) {
    const headerUserId = extractUserId(req);
    const userId = body.userId || (headerUserId !== 'default' ? headerUserId : 'dev_user_1');
    const cardholderName = body.cardholderName || 'Card Holder';
    const rawCardNumber = String(body.cardNumber || '4242424242424242').replace(/\s+/g, '');
    const expiryDate = body.expiryDate || '12/28';
    
    // Mask card number for PCI-DSS compliance
    const last4 = rawCardNumber.slice(-4) || '4242';
    const cardNumberMask = `•••• •••• •••• ${last4}`;

    // Detect card type
    let cardType = body.cardType || 'VISA';
    if (rawCardNumber.startsWith('5')) {
      cardType = 'MASTERCARD';
    } else if (rawCardNumber.startsWith('3')) {
      cardType = 'AMEX';
    }

    const isDefault = body.isDefault !== undefined ? Boolean(body.isDefault) : true;

    if (isDefault) {
      await this.prisma.userCard.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const userCard = await this.prisma.userCard.create({
      data: {
        userId,
        cardholderName,
        cardNumberMask,
        expiryDate,
        cardType,
        isDefault,
      },
    });

    return userCard;
  }

  @Get()
  async getUserCards(@Req() req: any, @Query('userId') queryUserId?: string) {
    const headerUserId = extractUserId(req);
    const userId = queryUserId || (headerUserId !== 'default' ? headerUserId : undefined);

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.userCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Delete(':id')
  async deleteCard(@Param('id') id: string) {
    return this.prisma.userCard.delete({
      where: { id },
    });
  }
}
