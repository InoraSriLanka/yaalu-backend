import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Body, Controller, Get, Param, Post, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CalculateFareDto {
  @ApiProperty({ description: 'Trip distance in kilometers', example: 7.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional({ description: 'Vehicle type (MOTORBIKE, THREE_WHEEL, CAR, VAN, bike, flex, mini)', example: 'THREE_WHEEL' })
  @IsOptional()
  @IsString()
  vehicleType?: string;
}

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
    return this.deliveryServiceService.getRideRequest(rideRequestId);
  }

  @Post('rides/:id/bid')
  @ApiOperation({ summary: 'Submit rider bid for ride request' })
  submitBid(@Param('id') rideRequestId: string, @Body() dto: SubmitBidDto) {
    return this.deliveryServiceService.postDriverBid({
      ...dto,
      rideRequestId,
    });
  }

  @Get('rides/:id/bids')
  @ApiOperation({ summary: 'Get all active driver bids for ride' })
  getBids(@Param('id') rideRequestId: string) {
    return this.deliveryServiceService.getBidsForRide(rideRequestId);
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
    const settings = await (this.prisma as any).fareSetting.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return (settings || []).map((cfg) => {
      const B = cfg.petrolPrice;
      const C = cfg.twoTOilRatio;
      const D = cfg.twoTOilPrice;
      const F = cfg.mileageKmPerLitre;
      const G = cfg.otherRunningCostPerKm;
      const H = cfg.fixedCostPerKm;
      const multiplier = cfg.profitMultiplier;
      const K = cfg.baseChargeFirstKm;
      const commissionPercent = cfg.commissionPercent;
      const bidTimeoutMinutes = cfg.bidTimeoutMinutes;

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

  private normalizeVehicleType(rawType?: string): string {
    if (!rawType) return 'THREE_WHEEL';
    const clean = rawType.toString().trim().toUpperCase();
    if (clean === 'BIKE' || clean === 'MOTORBIKE' || clean === 'COURIER') return 'MOTORBIKE';
    if (clean === 'FLEX' || clean === 'THREE_WHEEL' || clean === 'TUK' || clean === 'TUKTUK' || clean === 'THREEWHEEL') return 'THREE_WHEEL';
    if (clean === 'LUXURY' || clean === 'LUXURY_CAR' || clean === 'PREMIUM' || clean === 'LUX') return 'LUXURY_CAR';
    if (clean === 'MINI' || clean === 'CAR' || clean === 'TAXI' || clean === 'NORMAL_CAR' || clean === 'FLEX_TAXI') return 'CAR';
    if (clean === 'VAN' || clean === 'CARGO' || clean === 'LARGE') return 'VAN';
    return clean;
  }

  @Post('calculate-fare')
  @ApiOperation({ summary: 'Calculate dynamic ride fare using the standard mathematical formula' })
  async calculateFare(@Body() dto: CalculateFareDto) {
    const rawDist = dto && dto.distanceKm !== undefined && dto.distanceKm !== null ? Number(dto.distanceKm) : NaN;
    const distanceKm = !isNaN(rawDist) && rawDist >= 0 ? rawDist : 1.0;
    const vType = this.normalizeVehicleType(dto?.vehicleType);

    // Load rate settings directly from PostgreSQL fare_settings database table
    const config = await (this.prisma as any).fareSetting.findUnique({
      where: { vehicleType: vType },
    });

    if (!config) {
      throw new NotFoundException(`Fare setting rate parameters not found in database for vehicle type: ${vType}`);
    }

    const B = config.petrolPrice;
    const C = config.twoTOilRatio;
    const D = config.twoTOilPrice;
    const F = config.mileageKmPerLitre;
    const G = config.otherRunningCostPerKm;
    const H = config.fixedCostPerKm;
    const multiplier = config.profitMultiplier;
    const K = config.baseChargeFirstKm;
    const minFare = config.minimumFare;
    const commissionPercent = config.commissionPercent;
    const bidTimeoutMinutes = config.bidTimeoutMinutes;

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
      perKmRate: Math.round(J * 100) / 100,
      baseCharge: K,
      totalFare: roundedFare,
      formattedFare: 'LKR ' + roundedFare.toFixed(2),
      commissionPercent,
      commissionAmount,
      riderNetEarnings,
      bidTimeoutMinutes,
      bidTimeoutSeconds,
      breakdown: {
        fuelMixtureCostPerLitre: Math.round(A * 100) / 100,
        fuelCostPerKm: Math.round(E * 100) / 100,
        operatingCostPerKm: Math.round(I * 100) / 100,
        ratePerKm: Math.round(J * 100) / 100,
        baseChargeFirstKm: K,
        totalFare: roundedFare,
        commissionAmount,
        riderNetEarnings,
      },
    };
  }
}
