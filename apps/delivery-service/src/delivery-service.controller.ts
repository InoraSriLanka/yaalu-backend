import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeliveryServiceService } from './delivery-service.service';
import { BookDeliveryDto } from './dto/book-delivery.dto';
import {
  CreateRideRequestDto,
  SubmitBidDto,
  AcceptBidDto,
  VerifyPinDto,
  SubmitFeedbackDto,
} from './dto/ride-request.dto';
import { MSG_PATTERNS } from '@app/common';

@Controller()
export class DeliveryServiceController {
  constructor(private readonly deliveryService: DeliveryServiceService) {}

  @MessagePattern(MSG_PATTERNS.DELIVERY.BOOK)
  book(@Payload() dto: BookDeliveryDto) {
    return this.deliveryService.bookDelivery(dto);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.GET_STATUS)
  getStatus(@Payload() data: { id: string }) {
    return this.deliveryService.getStatus(data.id);
  }

  // ---------------- Rides & Driver Bidding Message Handlers ----------------

  @MessagePattern(MSG_PATTERNS.DELIVERY.CREATE_RIDE)
  createRide(@Payload() dto: CreateRideRequestDto) {
    return this.deliveryService.createRideRequest(dto);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.GET_RIDE)
  getRide(@Payload() data: { id: string }) {
    return this.deliveryService.getRideRequest(data.id);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.POST_BID)
  postBid(@Payload() dto: SubmitBidDto) {
    return this.deliveryService.postDriverBid(dto);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.GET_BIDS)
  getBids(@Payload() data: { rideRequestId: string }) {
    return this.deliveryService.getBidsForRide(data.rideRequestId);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.ACCEPT_BID)
  acceptBid(@Payload() dto: AcceptBidDto) {
    return this.deliveryService.acceptBid(dto);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.VERIFY_PIN)
  verifyPin(@Payload() dto: VerifyPinDto) {
    return this.deliveryService.verifyPin(dto);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.COMPLETE_RIDE)
  completeRide(@Payload() data: { rideRequestId: string }) {
    return this.deliveryService.completeRide(data);
  }

  @MessagePattern(MSG_PATTERNS.DELIVERY.SUBMIT_FEEDBACK)
  submitFeedback(@Payload() dto: SubmitFeedbackDto) {
    return this.deliveryService.submitFeedback(dto);
  }
}
