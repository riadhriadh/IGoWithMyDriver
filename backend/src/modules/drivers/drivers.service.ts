import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
    const locationData = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    // 1. Update MongoDB
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

    // 2. Cache in Redis for fast access
    const cacheKey = `driver:location:${id}`;
    try {
      await this.cacheManager.set(cacheKey, locationData, 300); // TTL: 5 minutes (in seconds)
      console.log(`📍 Position cachée dans Redis: ${cacheKey} → ${latitude}, ${longitude}`);
    } catch (error) {
      console.error('Redis cache error (non-blocking):', error.message);
      // Continue même si Redis échoue
    }
  }

  async getDriverLocation(id: string): Promise<{ latitude: number; longitude: number } | null> {
    // 1. Try Redis cache first (fast)
    const cacheKey = `driver:location:${id}`;
    
    try {
      const cached = await this.cacheManager.get<{ latitude: number; longitude: number; updatedAt: Date }>(cacheKey);
      
      if (cached) {
        console.log(`✅ Position récupérée depuis Redis: ${cacheKey}`);
        return { latitude: cached.latitude, longitude: cached.longitude };
      }
    } catch (error) {
      console.log('Redis cache miss (fallback to MongoDB)');
    }

    // 2. Fallback to MongoDB
    console.log(`📦 Position récupérée depuis MongoDB: ${id}`);
    const driver = await this.driverModel.findById(id).exec();
    if (driver && driver.currentLatitude && driver.currentLongitude) {
      const location = {
        latitude: driver.currentLatitude,
        longitude: driver.currentLongitude,
      };
      
      // Cache it for next time
      try {
        await this.cacheManager.set(cacheKey, 
          { ...location, updatedAt: driver.locationUpdatedAt || new Date() },
          300 // TTL in seconds
        );
      } catch (error) {
        console.log('Could not cache location in Redis (non-blocking)');
      }
      
      return location;
    }

    return null;
  }

  async getAllDriverLocations(): Promise<Array<{ driverId: string; latitude: number; longitude: number }>> {
    // Get all online drivers with locations
    const drivers = await this.driverModel
      .find({ 
        isOnline: true,
        currentLatitude: { $exists: true, $ne: null },
        currentLongitude: { $exists: true, $ne: null },
      })
      .select('_id currentLatitude currentLongitude')
      .exec();

    return drivers.map(driver => ({
      driverId: driver._id.toString(),
      latitude: driver.currentLatitude!,
      longitude: driver.currentLongitude!,
    }));
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.driverModel.updateOne({ _id: id }, { status }).exec();
  }

  async count(): Promise<number> {
    return this.driverModel.countDocuments().exec();
  }
}
