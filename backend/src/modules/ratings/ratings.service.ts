import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating, RatingDocument } from './schemas/rating.schema';

@Injectable()
export class RatingsService {
  constructor(@InjectModel(Rating.name) private ratingModel: Model<RatingDocument>) {}

  async create(ratingData: any): Promise<RatingDocument> {
    const rating = new this.ratingModel(ratingData);
    return rating.save();
  }

  async findById(id: string): Promise<RatingDocument> {
    const rating = await this.ratingModel.findById(id).exec();
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }
    return rating;
  }

  async findByRideId(rideId: string): Promise<RatingDocument[]> {
    return this.ratingModel.find({ rideId }).exec();
  }

  async findByDriverId(driverId: string): Promise<RatingDocument[]> {
    return this.ratingModel.find({ driverId }).exec();
  }

  async getAverageRating(driverId: string): Promise<number> {
    const result = await this.ratingModel.aggregate([
      { $match: { driverId } },
      { $group: { _id: null, average: { $avg: '$rating' } } },
    ]);
    return result[0]?.average || 0;
  }
}
