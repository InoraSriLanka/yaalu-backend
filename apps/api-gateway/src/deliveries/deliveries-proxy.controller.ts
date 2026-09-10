import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryServiceService } from '@app/delivery-service/delivery-service.service';
import {
  CreateRideRequestDto,
  SubmitBidDto,
  AcceptBidDto,
  VerifyPinDto,
  SubmitFeedbackDto,
} from '@app/delivery-service/dto/ride-request.dto';
import { BookDeliveryDto } from '@app/delivery-service/dto/book-delivery.dto';

@ApiTags('Deliveries & Rides')
@Controller('deliveries')
export class DeliveriesProxyController {
  constructor(private readonly deliveryServiceService: DeliveryServiceService) {}

  @Post('book')
  @ApiOperation({ summary: 'Book a ride or delivery trip' })
  @ApiResponse({ status: 201, description: 'Trip booked successfully' })
  book(@Body() dto: BookDeliveryDto) {
    return this.deliveryServiceService.bookDelivery(dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Track real-time trip or delivery status' })
  getStatus(@Param('id') id: string) {
    return this.deliveryServiceService.getStatus(id);
  }

  // ---------------- Rides & Driver Bidding REST Proxy Endpoints ----------------

  @Post('rides/request')
  @ApiOperation({ summary: 'Request a standard or bidding ride' })
  createRide(@Body() dto: CreateRideRequestDto) {
    console.log('[DeliveriesProxyController createRide DTO]:', JSON.stringify(dto));
    return this.deliveryServiceService.createRideRequest(dto);
  }

  @Get('rides/:id')
  @ApiOperation({ summary: 'Get ride details and status' })
  getRide(@Param('id') id: string) {
    return this.deliveryServiceService.getRideRequest(id);
  }

  @Post('rides/:id/bid')
  @ApiOperation({ summary: 'Submit driver fare bid for ride request' })
  postBid(@Param('id') rideRequestId: string, @Body() dto: SubmitBidDto) {
    return this.deliveryServiceService.postDriverBid({
      ...dto,
      rideRequestId,
    });
  }

  @Get('rides/:id/bids')
  @ApiOperation({ summary: 'Fetch all active bids for a ride request' })
  getBids(@Param('id') rideRequestId: string) {
    return this.deliveryServiceService.getBidsForRide(rideRequestId);
  }

  @Post('rides/:id/accept-bid')
  @ApiOperation({ summary: 'Accept a driver bid offer' })
  acceptBid(@Param('id') rideRequestId: string, @Body() dto: AcceptBidDto) {
    return this.deliveryServiceService.acceptBid({
      ...dto,
      rideRequestId,
    });
  }

  @Post('rides/:id/verify-pin')
  @ApiOperation({ summary: 'Verify 4-digit PIN code to start ride' })
  verifyPin(@Param('id') rideRequestId: string, @Body() dto: VerifyPinDto) {
    return this.deliveryServiceService.verifyPin({
      ...dto,
      rideRequestId,
    });
  }

  @Post('rides/:id/complete')
  @ApiOperation({ summary: 'Complete trip and calculate final fare' })
  completeRide(@Param('id') rideRequestId: string) {
    return this.deliveryServiceService.completeRide({ rideRequestId });
  }

  @Post('rides/:id/feedback')
  @ApiOperation({ summary: 'Submit driver feedback, rating, and tip' })
  submitFeedback(@Param('id') rideRequestId: string, @Body() dto: SubmitFeedbackDto) {
    return this.deliveryServiceService.submitFeedback({
      ...dto,
      rideRequestId,
    });
  }
}
