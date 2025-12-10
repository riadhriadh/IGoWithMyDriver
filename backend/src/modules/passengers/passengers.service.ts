import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Passenger, PassengerDocument } from './schemas/passenger.schema';

@Injectable()
export class PassengersService {
  constructor(@InjectModel(Passenger.name) private passengerModel: Model<PassengerDocument>) {}

  async findByUserId(userId: string): Promise<PassengerDocument> {
    const passenger = await this.passengerModel.findOne({ userId }).populate('userId').exec();
    if (!passenger) {
      throw new NotFoundException(`Passenger not found`);
    }
    return passenger;
  }

  async findAll(skip = 0, limit = 10): Promise<PassengerDocument[]> {
    return this.passengerModel.find().skip(skip).limit(limit).populate('userId').exec();
  }

  async update(id: string, updateData: any): Promise<PassengerDocument> {
    const passenger = await this.passengerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!passenger) {
      throw new NotFoundException(`Passenger not found`);
    }
    return passenger;
  }

  async count(): Promise<number> {
    return this.passengerModel.countDocuments().exec();
  }
}
