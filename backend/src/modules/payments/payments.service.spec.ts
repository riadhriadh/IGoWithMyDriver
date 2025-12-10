import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { Payment } from './schemas/payment.schema';
import { TestDataFactory } from '../../test/test-utils';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPaymentModel: any;

  const mockPayment = TestDataFactory.createPayment({
    status: 'completed',
  });

  beforeEach(async () => {
    mockPaymentModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const createPaymentDto = {
        rideId: 'ride123',
        passengerId: 'passenger123',
        driverId: 'driver123',
        amount: 45.5,
        currency: 'EUR',
        method: 'card',
      };

      mockPaymentModel.create.mockResolvedValue(
        TestDataFactory.createPayment(createPaymentDto),
      );

      const result = await service.createPayment(createPaymentDto);

      expect(mockPaymentModel.create).toHaveBeenCalledWith(createPaymentDto);
      expect(result.status).toBe('completed');
    });
  });

  describe('findById', () => {
    it('should find a payment by id', async () => {
      mockPaymentModel.findById.mockResolvedValue(mockPayment);

      const result = await service.findById(mockPayment._id);

      expect(result).toEqual(mockPayment);
    });
  });

  describe('findByRide', () => {
    it('should find payment by ride id', async () => {
      const rideId = 'ride123';
      mockPaymentModel.findById.mockResolvedValue(
        TestDataFactory.createPayment({ rideId }),
      );

      const result = await service.findByRide(rideId);

      expect(result).toBeDefined();
    });
  });

  describe('countPayments', () => {
    it('should count total payments', async () => {
      mockPaymentModel.countDocuments.mockResolvedValue(100);

      const result = await service.countPayments();

      expect(result).toBe(100);
    });

    it('should count payments by status', async () => {
      mockPaymentModel.countDocuments.mockResolvedValue(80);

      const result = await service.countPayments('completed');

      expect(result).toBe(80);
    });
  });
});
