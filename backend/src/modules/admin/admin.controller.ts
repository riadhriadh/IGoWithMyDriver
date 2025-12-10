import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PassportAuthGuard } from '@common/guards/passport-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(PassportAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query('userType') userType?: string, @Query('skip') skip = 0, @Query('limit') limit = 10) {
    return this.adminService.getUsers(userType, skip, limit);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers' })
  async getDrivers(@Query('skip') skip = 0, @Query('limit') limit = 10) {
    return this.adminService.getDrivers(skip, limit);
  }

  @Get('passengers')
  @ApiOperation({ summary: 'Get all passengers' })
  async getPassengers(@Query('skip') skip = 0, @Query('limit') limit = 10) {
    return this.adminService.getPassengers(skip, limit);
  }
}
