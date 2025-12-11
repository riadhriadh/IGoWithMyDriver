import { Controller, Get, Body, Patch, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get('profile')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current driver profile' })
  async getProfile(@GetUser() user: any) {
    const driver = await this.driversService.findByUserId(user._id);
    const userData = driver.userId as any;
    
    return {
      driver: {
        id: driver._id.toString(),
        email: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone,
        avatarUrl: userData.avatarUrl,
        status: driver.status,
        rating: driver.rating,
        totalRides: driver.totalRides,
        vehicleInfo: null, // TODO: Populate from vehicles collection
      },
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby available drivers' })
  async findNearby(@Query('latitude') latitude: number, @Query('longitude') longitude: number) {
    return this.driversService.findNearby(latitude, longitude);
  }

  @Patch('profile')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver profile' })
  async updateProfile(@GetUser() user: any, @Body() updateDriverDto: UpdateDriverDto) {
    const driver = await this.driversService.findByUserId(user._id);
    return this.driversService.update(driver._id.toString(), updateDriverDto);
  }

  @Patch('status')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current driver status' })
  async updateCurrentDriverStatus(@GetUser() user: any, @Body() body: { status: string }) {
    const driver = await this.driversService.findByUserId(user._id);
    await this.driversService.updateStatus(driver._id.toString(), body.status);
    return { message: 'Status updated successfully' };
  }

  @Patch('location')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current driver location' })
  async updateCurrentDriverLocation(@GetUser() user: any, @Body() body: { latitude: number; longitude: number }) {
    const driver = await this.driversService.findByUserId(user._id);
    await this.driversService.updateLocation(driver._id.toString(), body.latitude, body.longitude);
    return { message: 'Location updated successfully' };
  }

  @Get('earnings')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver earnings' })
  async getEarnings(@GetUser() user: any) {
    // TODO: Implement earnings calculation
    return {
      earnings: {
        today: 0,
        week: 0,
        month: 0,
        total: 0,
        currency: 'EUR',
      },
    };
  }

  @Get('stats')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver statistics' })
  async getStats(@GetUser() user: any) {
    // TODO: Implement stats calculation from rides
    return {
      stats: {
        totalRides: 0,
        completedRides: 0,
        cancelledRides: 0,
        rating: 0,
        totalRatings: 0,
        acceptanceRate: 0,
        totalEarnings: 0,
      },
    };
  }

  @Get('notification-preferences')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotificationPreferences(@GetUser() user: any) {
    // TODO: Implement with driver schema
    return {
      preferences: {
        newRides: true,
        planningReminders: true,
        supportMessages: true,
        payments: true,
        soundEnabled: true,
      },
    };
  }

  @Patch('notification-preferences')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotificationPreferences(@GetUser() user: any, @Body() preferences: any) {
    // TODO: Implement with driver schema
    return { message: 'Preferences updated successfully' };
  }

  @Get('vehicles')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver vehicles' })
  async getVehicles(@GetUser() user: any, @Query('isActive') isActive?: string) {
    // TODO: Implement vehicles endpoint
    return { vehicles: [] };
  }

  @Get('schedules')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver schedules' })
  async getSchedules(@GetUser() user: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    // TODO: Implement schedules endpoint
    return { schedules: [] };
  }

  @Get('incidents')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver incidents' })
  async getIncidents(@GetUser() user: any, @Query('status') status?: string) {
    // TODO: Implement incidents endpoint
    return { incidents: [] };
  }

  @Patch(':id/location')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver location by ID' })
  async updateLocation(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    await this.driversService.updateLocation(id, body.latitude, body.longitude);
    return { message: 'Location updated successfully' };
  }

  @Patch(':id/status')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver status by ID' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    await this.driversService.updateStatus(id, body.status);
    return { message: 'Status updated successfully' };
  }

  @Get()
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all drivers' })
  async findAll(@Query('skip') skip = 0, @Query('limit') limit = 10) {
    return this.driversService.findAll(skip, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  async findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }
}
