import { Controller, Get, Post, Body, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @UseGuards(PassportAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  async findByUser(@GetUser() user: any, @Query('skip') skip = 0, @Query('limit') limit = 10) {
    return this.paymentsService.findByUserId(user._id, skip, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
