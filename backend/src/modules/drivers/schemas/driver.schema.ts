import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DriverDocument = Driver & Document;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'available' })
  status: 'available' | 'busy' | 'offline';

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: false })
  isAvailable: boolean;

  @Prop({ type: Object })
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: Date;
  };

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalRides: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop()
  licenseNumber?: string;

  @Prop()
  licenseExpiry?: Date;

  @Prop([String])
  documentUrls?: string[];

  @Prop({ type: Object })
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    bankName?: string;
  };

  @Prop()
  biometricData?: string;

  @Prop({ type: Object, default: null })
  metadata?: {
    [key: string]: any;
  };
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

// Indexes
DriverSchema.index({ userId: 1 }, { unique: true });
DriverSchema.index({ status: 1 });
DriverSchema.index({ isOnline: 1 });
DriverSchema.index({ location: '2dsphere' });
DriverSchema.index({ rating: -1 });
DriverSchema.index({ createdAt: -1 });
