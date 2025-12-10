import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
  ARRIVED_AT_PICKUP = 'arrived_at_pickup',
  PASSENGER_ONBOARD = 'passenger_onboard',
  ARRIVED_AT_DESTINATION = 'arrived_at_destination',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export type RideDocument = Ride & Document;

@Schema({ timestamps: true })
export class Ride {
  @Prop({ type: Types.ObjectId, ref: 'Passenger', required: true })
  passengerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ required: true })
  pickupAddress: string;

  @Prop({ required: true })
  pickupLatitude: number;

  @Prop({ required: true })
  pickupLongitude: number;

  @Prop({ required: true })
  destinationAddress: string;

  @Prop({ required: true })
  destinationLatitude: number;

  @Prop({ required: true })
  destinationLongitude: number;

  @Prop({ required: true })
  estimatedFare: number;

  @Prop({ default: 0 })
  actualFare: number;

  @Prop({ required: true, enum: Object.values(RideStatus), default: RideStatus.REQUESTED })
  status: RideStatus;

  @Prop({ default: 'economy' })
  rideType: string;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  notes?: string;

  @Prop()
  acceptedAt?: Date;

  @Prop()
  arrivedAtPickupAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledReason?: string;

  @Prop({ type: Object })
  route?: {
    distance: number;
    duration: number;
  };

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop()
  feedback?: string;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

RideSchema.index({ passengerId: 1, createdAt: -1 });
RideSchema.index({ driverId: 1, createdAt: -1 });
RideSchema.index({ status: 1 });
RideSchema.index({ pickupLatitude: 1, pickupLongitude: 1 });
