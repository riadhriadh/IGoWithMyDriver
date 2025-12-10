import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument, RideStatus } from './schemas/ride.schema';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

@Injectable()
export class RidesService {
  constructor(@InjectModel(Ride.name) private rideModel: Model<RideDocument>) {}

  async create(createRideDto: CreateRideDto): Promise<RideDocument> {
    const ride = new this.rideModel(createRideDto);
    return ride.save();
  }

  async findById(id: string): Promise<RideDocument> {
    const ride = await this.rideModel.findById(id).populate(['passengerId', 'driverId']).exec();
    if (!ride) {
      throw new NotFoundException(`Ride not found`);
    }
    return ride;
  }

  async findByPassengerId(passengerId: string, skip = 0, limit = 10): Promise<RideDocument[]> {
    return this.rideModel.find({ passengerId }).skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findByDriverId(driverId: string, skip = 0, limit = 10): Promise<RideDocument[]> {
    return this.rideModel.find({ driverId }).skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findByStatus(status: RideStatus): Promise<RideDocument[]> {
    return this.rideModel.find({ status }).exec();
  }

  async update(id: string, updateRideDto: UpdateRideDto): Promise<RideDocument> {
    const ride = await this.rideModel.findByIdAndUpdate(id, updateRideDto, { new: true }).exec();
    if (!ride) {
      throw new NotFoundException(`Ride not found`);
    }
    return ride;
  }

  async updateStatus(id: string, status: RideStatus): Promise<RideDocument> {
    const ride = await this.rideModel.findById(id).exec();
    if (!ride) {
      throw new NotFoundException(`Ride not found`);
    }

    // Validate status transitions
    const validTransitions: { [key in RideStatus]?: RideStatus[] } = {
      [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
      [RideStatus.ACCEPTED]: [RideStatus.EN_ROUTE_TO_PICKUP, RideStatus.CANCELLED],
      [RideStatus.EN_ROUTE_TO_PICKUP]: [RideStatus.ARRIVED_AT_PICKUP, RideStatus.CANCELLED],
      [RideStatus.ARRIVED_AT_PICKUP]: [RideStatus.PASSENGER_ONBOARD, RideStatus.NO_SHOW],
      [RideStatus.PASSENGER_ONBOARD]: [RideStatus.ARRIVED_AT_DESTINATION, RideStatus.CANCELLED],
      [RideStatus.ARRIVED_AT_DESTINATION]: [RideStatus.COMPLETED],
    };

    if (!validTransitions[ride.status]?.includes(status)) {
      throw new BadRequestException(`Invalid status transition from ${ride.status} to ${status}`);
    }

    ride.status = status;
    return ride.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.rideModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Ride not found`);
    }
  }
}
