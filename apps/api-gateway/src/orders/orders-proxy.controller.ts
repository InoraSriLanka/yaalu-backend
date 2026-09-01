import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ORDER_SERVICE, MSG_PATTERNS } from '@app/common';

@ApiTags('Orders')
@Controller('orders')
export class OrdersProxyController {
  constructor(@Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  create(@Body() dto: any) {
    return this.orderClient.send(MSG_PATTERNS.ORDER.CREATE, dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get orders placed by a specific user' })
  findByUser(@Param('userId') userId: string) {
    return this.orderClient.send(MSG_PATTERNS.ORDER.GET_BY_USER, { userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order status and details by order ID' })
  findOne(@Param('id') id: string) {
    return this.orderClient.send(MSG_PATTERNS.ORDER.GET_BY_ID, { id });
  }
}
