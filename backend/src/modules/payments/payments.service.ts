import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(@InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>) {}

  async create(paymentData: any): Promise<PaymentDocument> {
    const payment = new this.paymentModel(paymentData);
    return payment.save();
  }

  async findById(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByUserId(userId: string, skip = 0, limit = 10): Promise<PaymentDocument[]> {
    return this.paymentModel.find({ userId }).skip(skip).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async findByRideId(rideId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ rideId }).exec();
  }

  async update(id: string, updateData: any): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }
}
