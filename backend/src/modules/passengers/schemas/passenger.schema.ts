import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PassengerDocument = Passenger & Document;

@Schema({ timestamps: true })
export class Passenger {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalRides: number;

  @Prop([String])
  favoriteLocations?: string[];

  @Prop([Types.ObjectId], { ref: 'Payment' })
  paymentMethods?: Types.ObjectId[];

  @Prop({ type: Object, default: null })
  metadata?: {
    [key: string]: any;
  };
}

export const PassengerSchema = SchemaFactory.createForClass(Passenger);

PassengerSchema.index({ userId: 1 }, { unique: true });
PassengerSchema.index({ rating: -1 });
PassengerSchema.index({ createdAt: -1 });
