import { Controller, Get, Patch, UseGuards, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PassengersService } from './passengers.service';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('Passengers')
@Controller('passengers')
export class PassengersController {
  constructor(private passengersService: PassengersService) {}

  @Get('profile')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current passenger profile' })
  async getProfile(@GetUser() user: any) {
    return this.passengersService.findByUserId(user._id);
  }

  @Patch('profile')
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update passenger profile' })
  async updateProfile(@GetUser() user: any, @Body() updateData: any) {
    const passenger = await this.passengersService.findByUserId(user._id);
    return this.passengersService.update(passenger._id, updateData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all passengers' })
  async findAll(@Query('skip') skip = 0, @Query('limit') limit = 10) {
    return this.passengersService.findAll(skip, limit);
  }
}
