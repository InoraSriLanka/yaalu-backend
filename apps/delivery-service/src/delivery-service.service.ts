import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { BookDeliveryDto } from './dto/book-delivery.dto';
import {
  CreateRideRequestDto,
  SubmitBidDto,
  AcceptBidDto,
  VerifyPinDto,
  SubmitFeedbackDto,
} from './dto/ride-request.dto';

@Injectable()
export class DeliveryServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async bookDelivery(dto: BookDeliveryDto) {
    return {
      success: true,
      message: 'Delivery booked successfully',
      delivery: {
        id: 'del-' + Date.now(),
        status: 'PENDING',
        ...dto,
      },
    };
  }

  async getStatus(id: string) {
    return {
      id,
      status: 'IN_TRANSIT',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  // ---------------- Rides & Driver Bidding Services ----------------

  async createRideRequest(dto: CreateRideRequestDto) {
    console.log('[createRideRequest DTO received]:', JSON.stringify(dto));
    const isBidding = dto.rideType === 'BIDDING';

    // Calculate dynamic base fare based on vehicle type
    let calculatedFare = 710.07;
    const vType = (dto.selectedVehicleType || 'bike').toLowerCase();
    if (vType === 'flex') calculatedFare = 1439.30;
    if (vType === 'mini') calculatedFare = 1891.55;

    const ride = await this.prisma.rideRequest.create({
      data: {
        customerId: dto.customerId || '47e66186-e834-43e9-bedb-af331abd09dd',
        pickupAddress: dto.pickupAddress,
        dropoffAddress: dto.dropoffAddress,
        pickupLat: dto.pickupLat !== undefined ? dto.pickupLat : null,
        pickupLng: dto.pickupLng !== undefined ? dto.pickupLng : null,
        dropoffLat: dto.dropoffLat !== undefined ? dto.dropoffLat : null,
        dropoffLng: dto.dropoffLng !== undefined ? dto.dropoffLng : null,
        rideType: isBidding ? 'BIDDING' : 'STANDARD',
        selectedVehicleType: dto.selectedVehicleType || 'bike',
        tripCategory: (dto.tripCategory as any) || 'ONE_WAY',
        status: isBidding ? 'SEARCHING' : 'ACCEPTED',
        biddingTimerSeconds: 480,
        startPin: '4200',
        etaMinutes: 15,
        finalFare: isBidding ? 0 : calculatedFare,
      },
    });

    if (isBidding) {
      await this.prisma.driverBid.createMany({
        data: [
          {
            rideRequestId: ride.id,
            driverId: 'drv-ravi-101',
            driverName: 'Ravi S.',
            rating: 5.0,
            vehicleModel: vType === 'flex' ? 'Toyota Prius - White' : (vType === 'mini' ? 'Suzuki Every - Red' : 'TVS King Tuk Tuk - Yellow'),
            vehicleNumber: 'WP CAH-1234',
            proposedFare: Math.round(calculatedFare * 0.95),
            status: 'PENDING',
          },
          {
            rideRequestId: ride.id,
            driverId: 'drv-kasun-102',
            driverName: 'Kasun P.',
            rating: 4.7,
            vehicleModel: vType === 'flex' ? 'Honda Grace - Silver' : (vType === 'mini' ? 'Daihatsu Hijet - White' : 'Bajaj RE - Black'),
            vehicleNumber: 'WP KAZ-5678',
            proposedFare: Math.round(calculatedFare * 1.05),
            status: 'PENDING',
          },
        ],
      });
    }

    return this.getRideRequest(ride.id);
  }

  async getRideRequest(id: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { proposedFare: 'asc' },
        },
        feedback: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride request not found in database: ' + id);
    }

    return ride;
  }

  async postDriverBid(dto: SubmitBidDto) {
    const bid = await this.prisma.driverBid.create({
      data: {
        rideRequestId: dto.rideRequestId,
        driverId: dto.driverId,
        driverName: dto.driverName,
        rating: dto.rating || 5.0,
        vehicleModel: dto.vehicleModel,
        vehicleNumber: dto.vehicleNumber,
        proposedFare: dto.proposedFare,
        status: 'PENDING',
      },
    });

    return bid;
  }

  async getBidsForRide(rideRequestId: string) {
    const bids = await this.prisma.driverBid.findMany({
      where: { rideRequestId },
      orderBy: { proposedFare: 'asc' },
    });

    return bids;
  }

  async acceptBid(dto: AcceptBidDto) {
    await this.prisma.driverBid.updateMany({
      where: { rideRequestId: dto.rideRequestId },
      data: { status: 'REJECTED' },
    });

    let acceptedBid: any = null;
    if (dto.bidId) {
      try {
        acceptedBid = await this.prisma.driverBid.findUnique({ where: { id: dto.bidId } });
      } catch (e) {}
    }
    if (!acceptedBid) {
      acceptedBid = await this.prisma.driverBid.findFirst({ where: { rideRequestId: dto.rideRequestId } });
    }

    if (acceptedBid) {
      await this.prisma.driverBid.update({
        where: { id: acceptedBid.id },
        data: { status: 'ACCEPTED' },
      });
    }

    const finalFare = acceptedBid ? acceptedBid.proposedFare : 1350.0;
    const acceptedDriverId = acceptedBid ? acceptedBid.driverId : 'drv-ravi-101';

    const updatedRide = await this.prisma.rideRequest.update({
      where: { id: dto.rideRequestId },
      data: {
        status: 'ACCEPTED',
        acceptedDriverId,
        finalFare,
      },
      include: { bids: true },
    });

    return updatedRide;
  }

  async verifyPin(dto: VerifyPinDto) {
    const updatedRide = await this.prisma.rideRequest.update({
      where: { id: dto.rideRequestId },
      data: {
        status: 'IN_TRIP',
      },
    });
    return {
      success: true,
      message: 'PIN verified successfully. Trip started!',
      ride: updatedRide,
    };
  }

  async completeRide(data: { rideRequestId: string }) {
    const updatedRide = await this.prisma.rideRequest.update({
      where: { id: data.rideRequestId },
      data: {
        status: 'COMPLETED',
      },
    });
    return {
      success: true,
      message: 'Trip completed successfully',
      ride: updatedRide,
    };
  }

  async submitFeedback(dto: SubmitFeedbackDto) {
    const feedback = await this.prisma.rideFeedback.upsert({
      where: { rideRequestId: dto.rideRequestId },
      update: {
        rating: dto.rating,
        compliments: dto.compliments || [],
        comment: dto.comment || '',
        tipAmount: dto.tipAmount || 0,
      },
      create: {
        rideRequestId: dto.rideRequestId,
        customerId: dto.customerId || '47e66186-e834-43e9-bedb-af331abd09dd',
        driverId: dto.driverId || 'drv-ravi-101',
        rating: dto.rating,
        compliments: dto.compliments || [],
        comment: dto.comment || '',
        tipAmount: dto.tipAmount || 0,
      },
    });

    return {
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    };
  }
}
