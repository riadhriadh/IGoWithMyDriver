import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(@InjectModel(Driver.name) private driverModel: Model<DriverDocument>) {}

  async findById(id: string): Promise<DriverDocument> {
    const driver = await this.driverModel.findById(id).populate('userId').exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async findByUserId(userId: string): Promise<DriverDocument> {
    const driver = await this.driverModel.findOne({ userId }).populate('userId').exec();
    if (!driver) {
      throw new NotFoundException(`Driver with user ID ${userId} not found`);
    }
    return driver;
  }

  async create(driverData: any): Promise<DriverDocument> {
    const driver = new this.driverModel(driverData);
    return driver.save();
  }

  async findAll(skip = 0, limit = 10): Promise<DriverDocument[]> {
    return this.driverModel.find().skip(skip).limit(limit).populate('userId').exec();
  }

  async findNearby(latitude: number, longitude: number, maxDistance = 5000): Promise<DriverDocument[]> {
    return this.driverModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
        status: 'available',
        isOnline: true,
      })
      .limit(10)
      .exec();
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<DriverDocument> {
    const driver = await this.driverModel.findByIdAndUpdate(id, updateDriverDto, { new: true }).exec();
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<void> {
    await this.driverModel.updateOne(
      { _id: id },
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
        },
        currentLatitude: latitude,
        currentLongitude: longitude,
        locationUpdatedAt: new Date(),
      },
    ).exec();
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.driverModel.updateOne({ _id: id }, { status }).exec();
  }

  async count(): Promise<number> {
    return this.driverModel.countDocuments().exec();
  }
}
