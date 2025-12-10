import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true })
export class Location {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true })
  driverId: Types.ObjectId;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: 0 })
  accuracy: number;

  @Prop({ default: 0 })
  altitude: number;

  @Prop({ default: 0 })
  speed: number;

  @Prop({ default: 0 })
  heading: number;

  @Prop({ type: Types.ObjectId, ref: 'Ride' })
  rideId?: Types.ObjectId;

  @Prop({ default: true })
  isOnline: boolean;

  @Prop({ default: 0 })
  batteryLevel: number;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({ driverId: 1, timestamp: -1 });
LocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
LocationSchema.index({ driverId: 1, rideId: 1 });
LocationSchema.index({ 'location': '2dsphere' });
