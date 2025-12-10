import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';

@Injectable()
export class LocationService {
  constructor(@InjectModel(Location.name) private locationModel: Model<LocationDocument>) {}

  async create(locationData: any): Promise<LocationDocument> {
    const location = new this.locationModel(locationData);
    return location.save();
  }

  async findByDriverId(driverId: string, limit = 100): Promise<LocationDocument[]> {
    return this.locationModel.find({ driverId }).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async findByRideId(rideId: string): Promise<LocationDocument[]> {
    return this.locationModel.find({ rideId }).sort({ timestamp: 1 }).exec();
  }

  async findLatestByDriverId(driverId: string): Promise<LocationDocument | null> {
    return this.locationModel.findOne({ driverId }).sort({ timestamp: -1 }).exec();
  }
}
