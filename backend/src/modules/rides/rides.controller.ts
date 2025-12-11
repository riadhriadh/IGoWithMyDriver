import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('Rides')
@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post()
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new ride request' })
  async create(@Body() createRideDto: CreateRideDto) {
    return this.ridesService.create(createRideDto);
  }

  @Get('active')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active ride for current driver' })
  async getActiveRide(@GetUser() user: any) {
    const rides = await this.ridesService.findByDriverId(user._id, 0, 1);
    const activeRide = rides.find((ride) => 
      ['pending', 'accepted', 'arrived', 'in_progress'].includes(ride.status)
    );
    return { ride: activeRide ? this.formatRide(activeRide) : null };
  }

  @Get('history')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ride history' })
  async getRideHistory(
    @GetUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const skip = (page - 1) * limit;
    if (user.userType === 'passenger') {
      const rides = await this.ridesService.findByPassengerId(user._id, skip, limit);
      return { rides: rides.map(r => this.formatRide(r)), total: rides.length };
    } else {
      const rides = await this.ridesService.findByDriverId(user._id, skip, limit);
      return { rides: rides.map(r => this.formatRide(r)), total: rides.length };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details' })
  async findOne(@Param('id') id: string) {
    const ride = await this.ridesService.findById(id);
    return this.formatRide(ride);
  }

  @Get()
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available rides' })
  async findAvailableRides(
    @GetUser() user: any,
    @Query('skip') skip = 0,
    @Query('limit') limit = 10,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number
  ) {
    // Get available rides for driver
    if (user.userType === 'driver') {
      // Get all pending rides (not assigned to any driver)
      const allRides = await this.ridesService.findByStatus('pending' as any);
      const availableRides = allRides.filter(ride => !ride.driverId);
      return { rides: availableRides.slice(skip, skip + limit).map(r => this.formatRide(r)) };
    }
    
    // For passengers, return their rides
    const rides = await this.ridesService.findByPassengerId(user._id, skip, limit);
    return { rides: rides.map(r => this.formatRide(r)) };
  }

  // Helper to format ride data
  private formatRide(ride: any) {
    const rideObj = ride.toObject ? ride.toObject() : ride;
    return {
      ...rideObj,
      id: rideObj._id?.toString(),
      driverId: rideObj.driverId?.toString(),
      passengerId: rideObj.passengerId?.toString(),
      pickupLocation: {
        latitude: rideObj.pickupLatitude,
        longitude: rideObj.pickupLongitude,
        address: rideObj.pickupAddress,
      },
      dropoffLocation: {
        latitude: rideObj.destinationLatitude,
        longitude: rideObj.destinationLongitude,
        address: rideObj.destinationAddress,
      },
      estimatedPrice: rideObj.estimatedFare,
      finalPrice: rideObj.actualFare,
      passenger: rideObj.passengerId ? {
        id: rideObj.passengerId?.toString(),
        fullName: 'Passager', // TODO: populate passenger data
        phone: '+33612345678',
      } : undefined,
    };
  }

  @Patch(':id')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ride' })
  async update(@Param('id') id: string, @Body() updateRideDto: UpdateRideDto) {
    return this.ridesService.update(id, updateRideDto);
  }

  @Patch(':id/status')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ride status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ridesService.updateStatus(id, body.status as any);
  }

  @Post(':id/accept')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a ride' })
  async acceptRide(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() body?: { estimatedArrivalTime?: number }
  ) {
    const ride = await this.ridesService.update(id, {
      driverId: user._id,
      status: 'accepted' as any,
      acceptedAt: new Date(),
    });
    return { ride: this.formatRide(ride) };
  }

  @Post(':id/start')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a ride' })
  async startRide(@Param('id') id: string, @GetUser() user: any) {
    const ride = await this.ridesService.update(id, {
      status: 'in_progress' as any,
      startedAt: new Date(),
    });
    return { ride: this.formatRide(ride) };
  }

  @Post(':id/complete')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete a ride' })
  async completeRide(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() body: { finalPrice?: number; actualDistance?: number; actualDuration?: number }
  ) {
    const updateData: any = {
      status: 'completed' as any,
      completedAt: new Date(),
    };
    
    if (body.finalPrice) {
      updateData.actualFare = body.finalPrice;
    }
    
    if (body.actualDistance || body.actualDuration) {
      updateData.route = {
        distance: body.actualDistance || 0,
        duration: body.actualDuration || 0,
      };
    }
    
    const ride = await this.ridesService.update(id, updateData);
    return { ride };
  }

  @Post(':id/cancel')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a ride' })
  async cancelRide(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() body: { reason: string; cancelledBy: 'driver' | 'passenger' }
  ) {
    const ride = await this.ridesService.update(id, {
      status: 'cancelled' as any,
      cancelledAt: new Date(),
    });
    return { ride: this.formatRide(ride) };
  }

  @Delete(':id')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ride' })
  async delete(@Param('id') id: string) {
    await this.ridesService.delete(id);
    return { message: 'Ride deleted successfully' };
  }
}
