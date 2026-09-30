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
    const clean = raw.trim().toUpperCase().replace(/[\s\-_]/g, '');
    if (clean === 'BIKE' || clean === 'MOTORBIKE' || clean === 'SCOOTER') return 'MOTORBIKE';
    if (clean === 'FLEX' || clean === 'THREEWHEEL' || clean === 'TUKTUK' || clean === 'TUK' || clean === 'TRICK') return 'THREE_WHEEL';
    if (clean === 'LUXURY' || clean === 'LUXURYCAR' || clean === 'PREMIUM' || clean === 'LUX') return 'LUXURY_CAR';
    if (clean === 'MINI' || clean === 'CAR' || clean === 'NORMALCAR' || clean === 'CAB' || clean === 'SEDAN') return 'CAR';
    if (clean === 'VAN' || clean === 'CARGO') return 'VAN';
    return clean;
  }

  async createRideRequest(dto: CreateRideRequestDto) {
    console.log('[createRideRequest DTO received]:', JSON.stringify(dto));
    const isBidding = dto.rideType === 'BIDDING';

    const dbVehicleType = this.normalizeVehicleType(dto.selectedVehicleType);
    let fareConfig = await this.prisma.fareSetting.findUnique({
      where: { vehicleType: dbVehicleType },
    });

    if (!fareConfig) {
      fareConfig = await this.prisma.fareSetting.findFirst({
        where: { isActive: true },
      });
    }

    const B = fareConfig?.petrolPrice ?? 370;
    const C = fareConfig?.twoTOilRatio ?? 0;
    const D = fareConfig?.twoTOilPrice ?? 1500;
    const F = fareConfig?.mileageKmPerLitre ?? 25;
    const G = fareConfig?.otherRunningCostPerKm ?? 5;
    const H = fareConfig?.fixedCostPerKm ?? 3;
    const multiplier = fareConfig?.profitMultiplier ?? 3;
    const K = fareConfig?.baseChargeFirstKm ?? 150;
    const minFare = fareConfig?.minimumFare ?? 150;

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
        customerId: dto.customerId || '',
        pickupAddress: dto.pickupAddress,
        dropoffAddress: dto.dropoffAddress,
        pickupLat: dto.pickupLat !== undefined ? dto.pickupLat : null,
        pickupLng: dto.pickupLng !== undefined ? dto.pickupLng : null,
        dropoffLat: dto.dropoffLat !== undefined ? dto.dropoffLat : null,
        dropoffLng: dto.dropoffLng !== undefined ? dto.dropoffLng : null,
        rideType: isBidding ? 'BIDDING' : 'STANDARD',
        selectedVehicleType: dto.selectedVehicleType || 'THREE_WHEEL',
        tripCategory: (dto.tripCategory as any) || 'ONE_WAY',
        status: isBidding ? 'BIDDING_ACTIVE' : 'SEARCHING',
        biddingTimerSeconds: 480,
        startPin: Math.floor(1000 + Math.random() * 9000).toString(),
        etaMinutes: 15,
        finalFare: calculatedFare,
      },
    });

    if (isBidding) {
      let dbRiders: any[] = [];
      try {
        dbRiders = await this.prisma.riderProfile.findMany({ take: 5 });
      } catch (e) {}

      if (dbRiders && dbRiders.length > 0) {
        await this.prisma.driverBid.createMany({
          data: dbRiders.map((r, idx) => ({
            rideRequestId: ride.id,
            driverId: r.userId || r.id,
            driverName: r.fullName || r.vehicleNumber || 'Driver',
            rating: r.rating || 5.0,
            vehicleModel: r.vehicleModel || r.vehicleType || '',
            vehicleNumber: r.vehicleNumber || '',
            proposedFare: Math.round(calculatedFare * (0.95 + idx * 0.05) * 100) / 100,
            status: 'PENDING',
          })),
        });
      }
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

    if (ride.acceptedDriverId) {
      try {
        const rider = await this.prisma.riderProfile.findFirst({
          where: {
            OR: [
              { id: ride.acceptedDriverId },
              { userId: ride.acceptedDriverId },
            ],
          },
        });
        if (rider) {
          (ride as any).acceptedDriver = {
            id: rider.id,
            userId: rider.userId,
            fullName: rider.fullName || '',
            phoneNumber: rider.phoneNumber || '',
            profilePhotoUrl: rider.profilePhotoUrl || '',
            vehicleNumber: rider.vehicleNumber || '',
            vehicleModel: rider.vehicleModel || rider.vehicleType || '',
            vehicleColor: (rider as any).vehicleColor || '',
            vehiclePhotoUrl: rider.licenseFrontUrl || '',
            currentLatitude: rider.currentLatitude || null,
            currentLongitude: rider.currentLongitude || null,
            rating: rider.rating || 5.0,
            deliveriesCompleted: rider.deliveriesCompleted || 0,
          };
        }
      } catch (e) {}
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

    const ride = await this.prisma.rideRequest.findUnique({ where: { id: dto.rideRequestId } });
    const finalFare = acceptedBid ? acceptedBid.proposedFare : (ride?.finalFare || 0);
    const acceptedDriverId = acceptedBid ? acceptedBid.driverId : null;

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
    const ride = await this.prisma.rideRequest.findUnique({ where: { id: dto.rideRequestId } });
    if (!ride) {
      throw new NotFoundException('Ride request not found: ' + dto.rideRequestId);
    }
    if (dto.pin !== ride.startPin) {
      throw new Error('Invalid OTP code. Please enter the 4-digit OTP sent to your phone.');
    }
    const updatedRide = await this.prisma.rideRequest.update({
      where: { id: dto.rideRequestId },
      data: {
        status: 'IN_TRIP',
      },
    });
    return {
      success: true,
      message: 'OTP verified successfully. Trip started!',
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
        customerId: dto.customerId || '',
        driverId: dto.driverId || '',
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

  async getNearbyRiders(query: { pickupLat?: number; pickupLng?: number; vehicleType?: string; radiusKm?: number }) {
    const pLat = query.pickupLat ?? 6.9271;
    const pLng = query.pickupLng ?? 79.8612;
    const normVehicle = this.normalizeVehicleType(query.vehicleType);

    let riders: any[] = [];
    try {
      riders = await this.prisma.riderProfile.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (e) {
      console.warn('[getNearbyRiders Prisma DB error]:', e);
    }

    if (!riders || riders.length === 0) {
      return [];
    }

    const mappedRealRiders = riders.map((r, index) => {
      const dbVehNorm = this.normalizeVehicleType(r.vehicleType);
      
      const rLat = (r.currentLatitude !== null && r.currentLatitude !== undefined && !isNaN(r.currentLatitude) && r.currentLatitude !== 0)
        ? r.currentLatitude
        : pLat + (index === 0 ? 0.003 : (index % 2 === 0 ? 0.004 * (index + 1) : -0.003 * (index + 1)));

      const rLng = (r.currentLongitude !== null && r.currentLongitude !== undefined && !isNaN(r.currentLongitude) && r.currentLongitude !== 0)
        ? r.currentLongitude
        : pLng + (index === 0 ? 0.002 : (index % 2 === 0 ? -0.004 * (index + 1) : 0.005 * (index + 1)));

      const dist = this.calcDistanceKm(pLat, pLng, rLat, rLng);
      const etaMins = Math.max(1, Math.ceil((dist / 30) * 60) + 1);

      const displayName = r.fullName || r.user?.fullName || r.user?.name || '';
      const phone = r.phoneNumber || r.user?.phone || r.user?.phoneNumber || '';

      return {
        id: r.id,
        userId: r.userId,
        fullName: displayName,
        phoneNumber: phone,
        profilePhotoUrl: r.profilePhotoUrl || '',
        vehicleType: r.vehicleType || normVehicle,
        normalizedVehicleType: dbVehNorm,
        vehicleModel: r.vehicleModel || r.vehicleType || '',
        vehicleNumber: r.vehicleNumber || '',
        rating: r.rating ?? 5.0,
        deliveriesCompleted: r.deliveriesCompleted ?? 0,
        currentLatitude: rLat,
        currentLongitude: rLng,
        distanceKm: Math.round(dist * 10) / 10,
        etaMinutes: etaMins,
        etaText: `In ${etaMins} min`,
      };
    });

    const matchingRiders = mappedRealRiders.filter((r) => r.normalizedVehicleType === normVehicle);

    if (matchingRiders.length > 0) {
      return matchingRiders;
    }

    return mappedRealRiders.map((r) => ({
      ...r,
      normalizedVehicleType: normVehicle,
    }));
  }
}



