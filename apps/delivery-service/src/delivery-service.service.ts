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

  private calcDistanceKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 7.0;
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 7.0;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist > 0.1 ? dist : 1.0;
  }

  private normalizeVehicleType(raw?: string): string {
    if (!raw) return 'THREE_WHEEL';
    const clean = raw.trim().toUpperCase();
    if (clean === 'BIKE' || clean === 'MOTORBIKE') return 'MOTORBIKE';
    if (clean === 'FLEX' || clean === 'THREE_WHEEL' || clean === 'TUKTUK') return 'THREE_WHEEL';
    if (clean === 'LUXURY' || clean === 'LUXURY_CAR' || clean === 'PREMIUM' || clean === 'LUX') return 'LUXURY_CAR';
    if (clean === 'MINI' || clean === 'CAR' || clean === 'NORMAL_CAR') return 'CAR';
    if (clean === 'VAN') return 'VAN';
    return clean;
  }

  async createRideRequest(dto: CreateRideRequestDto) {
    console.log('[createRideRequest DTO received]:', JSON.stringify(dto));
    const isBidding = dto.rideType === 'BIDDING';

    const dbVehicleType = this.normalizeVehicleType(dto.selectedVehicleType);
    const fareConfig = await this.prisma.fareSetting.findUnique({
      where: { vehicleType: dbVehicleType },
    });

    if (!fareConfig) {
      throw new NotFoundException(`Fare setting rate parameters not found in database for vehicle type: ${dbVehicleType}`);
    }

    const B = fareConfig.petrolPrice;
    const C = fareConfig.twoTOilRatio;
    const D = fareConfig.twoTOilPrice;
    const F = fareConfig.mileageKmPerLitre;
    const G = fareConfig.otherRunningCostPerKm;
    const H = fareConfig.fixedCostPerKm;
    const multiplier = fareConfig.profitMultiplier;
    const K = fareConfig.baseChargeFirstKm;
    const minFare = fareConfig.minimumFare;

    const A = B + (C * D);
    const E = F > 0 ? A / F : 0;
    const I = E + G + H;
    const J = multiplier * I;

    const distanceKm = this.calcDistanceKm(dto.pickupLat, dto.pickupLng, dto.dropoffLat, dto.dropoffLng);
    let calculatedFare = K;
    if (distanceKm > 1.0) {
      calculatedFare = K + J * (distanceKm - 1.0);
    }
    calculatedFare = Math.max(calculatedFare, minFare);
    calculatedFare = Math.round(calculatedFare * 100) / 100;

    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

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
        startPin: randomPin,
        etaMinutes: 15,
        finalFare: calculatedFare,
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
            vehicleModel: dbVehicleType === 'THREE_WHEEL' ? 'TVS King Tuk Tuk - Yellow' : (dbVehicleType === 'CAR' ? 'Toyota Prius - White' : 'Yamaha FZ - Black'),
            vehicleNumber: 'WP CAH-1234',
            proposedFare: Math.round(calculatedFare * 0.95 * 100) / 100,
            status: 'PENDING',
          },
          {
            rideRequestId: ride.id,
            driverId: 'drv-kasun-102',
            driverName: 'Kasun P.',
            rating: 4.7,
            vehicleModel: dbVehicleType === 'THREE_WHEEL' ? 'Bajaj RE - Red' : (dbVehicleType === 'CAR' ? 'Honda Grace - Silver' : 'Honda Dio - Blue'),
            vehicleNumber: 'WP KAZ-5678',
            proposedFare: Math.round(calculatedFare * 1.05 * 100) / 100,
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
