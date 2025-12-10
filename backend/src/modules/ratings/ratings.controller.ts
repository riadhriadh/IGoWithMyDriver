import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Post()
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create rating' })
  async create(@GetUser() user: any, @Body() body: any) {
    return this.ratingsService.create({
      ...body,
      ratedBy: user.userType,
    });
  }

  @Get('driver/:driverId/average')
  @ApiOperation({ summary: 'Get driver average rating' })
  async getAverageRating(@Param('driverId') driverId: string) {
    const average = await this.ratingsService.getAverageRating(driverId);
    return { driverId, average };
  }

  @Get('ride/:rideId')
  @ApiOperation({ summary: 'Get ratings for a ride' })
  async findByRideId(@Param('rideId') rideId: string) {
    return this.ratingsService.findByRideId(rideId);
  }
}
