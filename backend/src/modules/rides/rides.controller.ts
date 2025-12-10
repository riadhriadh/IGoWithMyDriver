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

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details' })
  async findOne(@Param('id') id: string) {
    return this.ridesService.findById(id);
  }

  @Get()
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user rides' })
  async findByUser(@GetUser() user: any, @Query('skip') skip = 0, @Query('limit') limit = 10) {
    if (user.userType === 'passenger') {
      return this.ridesService.findByPassengerId(user._id, skip, limit);
    } else {
      return this.ridesService.findByDriverId(user._id, skip, limit);
    }
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

  @Delete(':id')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ride' })
  async delete(@Param('id') id: string) {
    await this.ridesService.delete(id);
    return { message: 'Ride deleted successfully' };
  }
}
