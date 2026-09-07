import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CustomersService } from '@app/order-service/customers/customers.service';

function extractUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer dev-token-')) {
    return auth.replace('Bearer dev-token-', '');
  }
  return 'default';
}

@Controller('customers')
export class CustomersProxyController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const merchantId = extractUserId(req);
    return this.customersService.create({ ...body, merchantId });
  }

  @Get()
  findAll(@Req() req: any) {
    const merchantId = extractUserId(req);
    return this.customersService.findAll(merchantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.customersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
