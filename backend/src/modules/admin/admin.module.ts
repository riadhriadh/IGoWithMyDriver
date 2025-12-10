import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DriversModule } from '@modules/drivers/drivers.module';
import { PassengersModule } from '@modules/passengers/passengers.module';
import { RidesModule } from '@modules/rides/rides.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [DriversModule, PassengersModule, RidesModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
