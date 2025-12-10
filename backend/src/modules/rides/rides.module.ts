import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema } from './schemas/ride.schema';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { RidesGateway } from './rides.gateway';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }])],
  providers: [RidesService, RidesGateway],
  controllers: [RidesController],
  exports: [RidesService],
})
export class RidesModule {}
