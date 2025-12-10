import { Injectable } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { DriversService } from '@modules/drivers/drivers.service';
import { PassengersService } from '@modules/passengers/passengers.service';
import { RidesService } from '@modules/rides/rides.service';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private driversService: DriversService,
    private passengersService: PassengersService,
    private ridesService: RidesService,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.usersService.count();
    const totalDrivers = await this.driversService.count();
    const totalPassengers = await this.passengersService.count();

    return {
      totalUsers,
      totalDrivers,
      totalPassengers,
      timestamp: new Date(),
    };
  }

  async getUsers(userType?: string, skip = 0, limit = 10) {
    return this.usersService.findAll(userType, skip, limit);
  }

  async getDrivers(skip = 0, limit = 10) {
    return this.driversService.findAll(skip, limit);
  }

  async getPassengers(skip = 0, limit = 10) {
    return this.passengersService.findAll(skip, limit);
  }
}
