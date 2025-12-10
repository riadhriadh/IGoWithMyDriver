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
    return this.driversService.findByUserId(user._id);
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

  @Patch(':id/location')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver location' })
  async updateLocation(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    await this.driversService.updateLocation(id, body.latitude, body.longitude);
    return { message: 'Location updated successfully' };
  }

  @Patch(':id/status')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver status' })
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
