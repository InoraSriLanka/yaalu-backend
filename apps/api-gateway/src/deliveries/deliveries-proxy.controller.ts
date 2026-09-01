import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DELIVERY_SERVICE, MSG_PATTERNS } from '@app/common';

@ApiTags('Deliveries & Rides')
@Controller('deliveries')
export class DeliveriesProxyController {
  constructor(@Inject(DELIVERY_SERVICE) private readonly deliveryClient: ClientProxy) {}

  @Post('book')
  @ApiOperation({ summary: 'Book a ride or delivery trip' })
  @ApiResponse({ status: 201, description: 'Trip booked successfully' })
  book(@Body() dto: any) {
    return this.deliveryClient.send(MSG_PATTERNS.DELIVERY.BOOK, dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Track real-time trip or delivery status' })
  getStatus(@Param('id') id: string) {
    return this.deliveryClient.send(MSG_PATTERNS.DELIVERY.GET_STATUS, { id });
  }
}
