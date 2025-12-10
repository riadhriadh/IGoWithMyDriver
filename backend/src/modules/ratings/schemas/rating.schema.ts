import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Passenger' })
  passengerId?: Types.ObjectId;

  @Prop({ min: 1, max: 5, required: true })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ default: 'driver' })
  ratedBy: string; // 'driver' or 'passenger'
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

RatingSchema.index({ rideId: 1 });
RatingSchema.index({ driverId: 1 });
RatingSchema.index({ passengerId: 1 });
RatingSchema.index({ createdAt: -1 });
