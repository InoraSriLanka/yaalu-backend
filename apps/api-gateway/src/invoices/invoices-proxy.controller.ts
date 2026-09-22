import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { InvoicesService } from '@app/order-service/invoices/invoices.service';

function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('invoices')
export class InvoicesProxyController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const merchantId = extractUserId(req);
    return this.invoicesService.create({ ...body, merchantId });
  }

  @Get()
  findAll(@Req() req: any) {
    const merchantId = extractUserId(req);
    return this.invoicesService.findAll(merchantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/pay')
  markAsPaid(@Param('id') id: string) {
    return this.invoicesService.markAsPaid(id);
  }
}
