import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Location, LocationSchema } from './schemas/location.schema';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';

@Module({
  imports: [MongooseModule.forFeature([{ name: Location.name, schema: LocationSchema }])],
  providers: [LocationService, LocationGateway],
  exports: [LocationService],
})
export class LocationModule {}
