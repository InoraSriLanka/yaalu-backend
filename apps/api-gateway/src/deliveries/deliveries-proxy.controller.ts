import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryServiceService } from '@app/delivery-service/delivery-service.service';
import { PrismaService } from '@app/common';
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
  constructor(
    private readonly deliveryServiceService: DeliveryServiceService,
    private readonly prisma: PrismaService,
  ) {}

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
  @ApiOperation({ summary: 'Get ride details and tracking info' })
  getRide(@Param('id') rideRequestId: string) {
    return this.deliveryServiceService.getRideDetails({ rideRequestId });
  }

  @Post('rides/:id/bid')
  @ApiOperation({ summary: 'Submit rider bid for ride request' })
  submitBid(@Param('id') rideRequestId: string, @Body() dto: SubmitBidDto) {
    return this.deliveryServiceService.submitBid({
      ...dto,
      rideRequestId,
    });
  }

  @Get('rides/:id/bids')
  @ApiOperation({ summary: 'Get all active driver bids for ride' })
  getBids(@Param('id') rideRequestId: string) {
    return this.deliveryServiceService.getBids({ rideRequestId });
  }

  @Post('rides/:id/accept-bid')
  @ApiOperation({ summary: 'Passenger accepts driver bid' })
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

  // ---------------- Live Mathematical Fare Pricing & Rates (Customer & Rider Apps) ----------------

  @Get('fare-rates')
  @ApiOperation({ summary: 'Get all active vehicle fare rates, 1 km fee, and bidding rules' })
  async getFareRates() {
    let settings: any[] = [];
    try {
      settings = await (this.prisma as any).fareSetting?.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }) || [];
    } catch {
      // fallback
    }

    if (!settings || settings.length === 0) {
      settings = [
        { vehicleType: 'THREE_WHEEL', vehicleName: 'Three-Wheeler / Tuk Tuk', petrolPrice: 370, twoTOilRatio: 0.02, twoTOilPrice: 1500, mileageKmPerLitre: 25, otherRunningCostPerKm: 5, fixedCostPerKm: 3, profitMultiplier: 3, baseChargeFirstKm: 150, minimumFare: 150, commissionPercent: 10, bidTimeoutMinutes: 2 },
        { vehicleType: 'MOTORBIKE', vehicleName: 'Motorbike / Courier', petrolPrice: 370, twoTOilRatio: 0, twoTOilPrice: 0, mileageKmPerLitre: 45, otherRunningCostPerKm: 3, fixedCostPerKm: 2, profitMultiplier: 3, baseChargeFirstKm: 100, minimumFare: 100, commissionPercent: 10, bidTimeoutMinutes: 2 },
        { vehicleType: 'CAR', vehicleName: 'Car / Flex Taxi', petrolPrice: 370, twoTOilRatio: 0, twoTOilPrice: 0, mileageKmPerLitre: 14, otherRunningCostPerKm: 10, fixedCostPerKm: 6, profitMultiplier: 3, baseChargeFirstKm: 250, minimumFare: 250, commissionPercent: 12, bidTimeoutMinutes: 3 },
        { vehicleType: 'VAN', vehicleName: 'Van / Large Cargo', petrolPrice: 370, twoTOilRatio: 0, twoTOilPrice: 0, mileageKmPerLitre: 10, otherRunningCostPerKm: 15, fixedCostPerKm: 8, profitMultiplier: 3, baseChargeFirstKm: 350, minimumFare: 350, commissionPercent: 15, bidTimeoutMinutes: 5 },
      ];
    }

    return settings.map((cfg) => {
      const B = cfg.petrolPrice || 370.0;
      const C = cfg.twoTOilRatio !== undefined ? cfg.twoTOilRatio : 0.02;
      const D = cfg.twoTOilPrice || 1500.0;
      const F = cfg.mileageKmPerLitre || 25.0;
      const G = cfg.otherRunningCostPerKm || 5.0;
      const H = cfg.fixedCostPerKm || 3.0;
      const multiplier = cfg.profitMultiplier || 3.0;
      const K = cfg.baseChargeFirstKm || 150.0;
      const commissionPercent = cfg.commissionPercent !== undefined ? cfg.commissionPercent : 10.0;
      const bidTimeoutMinutes = cfg.bidTimeoutMinutes !== undefined ? cfg.bidTimeoutMinutes : 2.0;

      const A = B + (C * D);
      const E = F > 0 ? A / F : 0;
      const I = E + G + H;
      const J = multiplier * I; // 1 km rate

      return {
        vehicleType: cfg.vehicleType,
        vehicleName: cfg.vehicleName,
        baseChargeFirstKm: K,
        ratePerKm: Math.round(J * 100) / 100,
        commissionPercent,
        bidTimeoutMinutes,
        bidTimeoutSeconds: Math.round(bidTimeoutMinutes * 60),
      };
    });
  }

  @Post('calculate-fare')
  @ApiOperation({ summary: 'Calculate dynamic ride fare using the standard mathematical formula' })
  async calculateFare(@Body() body: { distanceKm: number; vehicleType?: string }) {
    const distanceKm = Math.max(0, parseFloat(body.distanceKm as any) || 1.0);
    const vType = body.vehicleType || 'THREE_WHEEL';

    let config: any = null;
    try {
      config = await (this.prisma as any).fareSetting?.findUnique({
        where: { vehicleType: vType },
      });
    } catch {
      // fallback
    }

    // Fallbacks if not in DB yet
    const B = config?.petrolPrice || 370.0; // Petrol price / L
    const C = config?.twoTOilRatio !== undefined ? config.twoTOilRatio : (vType === 'THREE_WHEEL' ? 0.02 : 0.0);
    const D = config?.twoTOilPrice || 1500.0;
    const F = config?.mileageKmPerLitre || (vType === 'THREE_WHEEL' ? 25.0 : (vType === 'MOTORBIKE' ? 45.0 : 14.0));
    const G = config?.otherRunningCostPerKm || (vType === 'THREE_WHEEL' ? 5.0 : 3.0);
    const H = config?.fixedCostPerKm || (vType === 'THREE_WHEEL' ? 3.0 : 2.0);
    const multiplier = config?.profitMultiplier || 3.0;
    const K = config?.baseChargeFirstKm || (vType === 'THREE_WHEEL' ? 150.0 : (vType === 'MOTORBIKE' ? 100.0 : 250.0));
    const minFare = config?.minimumFare || K;
    const commissionPercent = config?.commissionPercent !== undefined ? config.commissionPercent : 10.0;
    const bidTimeoutMinutes = config?.bidTimeoutMinutes !== undefined ? config.bidTimeoutMinutes : 2.0;

    // Step 1: Fuel Mixture Cost A = B + (C * D)
    const A = B + (C * D);

    // Step 2: Fuel Cost per km E = A / F
    const E = F > 0 ? A / F : 0;

    // Step 3: Total Operating Cost per km I = E + G + H
    const I = E + G + H;

    // Step 4: 1 km rate charged to customer J = Multiplier * I
    const J = multiplier * I;

    // Step 5: Total Trip Fare L = K + J * (distanceKm - 1)
    let L = K;
    if (distanceKm > 1.0) {
      L = K + J * (distanceKm - 1.0);
    }
    L = Math.max(L, minFare);

    const roundedFare = Math.round(L * 100) / 100;
    const commissionAmount = Math.round(roundedFare * (commissionPercent / 100) * 100) / 100;
    const riderNetEarnings = Math.round((roundedFare - commissionAmount) * 100) / 100;
    const bidTimeoutSeconds = Math.round(bidTimeoutMinutes * 60);

    return {
      distanceKm,
      vehicleType: vType,
      perKmRate: Math.round(J * 100) / 100, // 1 km rate (J)
      baseCharge: K, // 1st km base fare (K)
      totalFare: roundedFare, // Customer Total Fare (L)
      commissionPercent, // Platform commission %
      commissionAmount, // Yaalu Platform Share (LKR)
      riderNetEarnings, // Net Rider Take-Home (LKR)
      bidTimeoutMinutes, // Bid Window (Minutes)
      bidTimeoutSeconds, // Bid Window (Seconds)
      breakdown: {
        fuelMixtureCostPerLitre: Math.round(A * 100) / 100, // (A)
        fuelCostPerKm: Math.round(E * 100) / 100, // (E)
        operatingCostPerKm: Math.round(I * 100) / 100, // (I)
        ratePerKm: Math.round(J * 100) / 100, // (J)
        baseChargeFirstKm: K, // (K)
        totalFare: roundedFare, // (L)
        commissionAmount,
        riderNetEarnings,
      },
    };
  }
}
