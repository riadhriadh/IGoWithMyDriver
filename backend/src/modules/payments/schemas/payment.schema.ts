import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['card', 'wallet', 'cash'], default: 'card' })
  method: string;

  @Prop({ enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Prop()
  transactionId?: string;

  @Prop()
  gatewayResponse?: string;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ rideId: 1 });
PaymentSchema.index({ status: 1 });
