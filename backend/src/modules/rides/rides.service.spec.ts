import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RidesService } from './rides.service';
import { Ride } from './schemas/ride.schema';
import { TestDataFactory } from '../../test/test-utils';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RidesService', () => {
  let service: RidesService;
  let mockRideModel: any;

  const mockRide = TestDataFactory.createRide({
    status: 'REQUESTED',
  });

  const mockRideList = [
    mockRide,
    TestDataFactory.createRide({ status: 'ACCEPTED' }),
  ];

  beforeEach(async () => {
    mockRideModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
      lean: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        {
          provide: getModelToken(Ride.name),
          useValue: mockRideModel,
        },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRide', () => {
    it('should create a ride successfully', async () => {
      const createRideDto = {
        passengerId: 'passenger123',
        pickupLocation: {
          coordinates: [2.3522, 48.8566],
          address: '123 Paris Street',
        },
        dropoffLocation: {
          coordinates: [2.4000, 48.9000],
          address: '456 Paris Street',
        },
      };

      const expectedRide = TestDataFactory.createRide(createRideDto);

      mockRideModel.create.mockResolvedValue(expectedRide);

      const result = await service.createRide(createRideDto);

      expect(mockRideModel.create).toHaveBeenCalled();
      expect(result.status).toBe('REQUESTED');
    });
  });

  describe('findById', () => {
    it('should find a ride by id', async () => {
      const rideId = mockRide._id;

      mockRideModel.findById.mockResolvedValue(mockRide);

      const result = await service.findById(rideId);

      expect(mockRideModel.findById).toHaveBeenCalledWith(rideId);
      expect(result).toEqual(mockRide);
    });

    it('should return null if ride not found', async () => {
      const rideId = 'nonexistentId';

      mockRideModel.findById.mockResolvedValue(null);

      const result = await service.findById(rideId);

      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should find rides by status', async () => {
      const requestedRides = [
        TestDataFactory.createRide({ status: 'REQUESTED' }),
        TestDataFactory.createRide({ status: 'REQUESTED' }),
      ];

      mockRideModel.find.mockResolvedValue(requestedRides);

      const result = await service.findByStatus('REQUESTED');

      expect(mockRideModel.find).toHaveBeenCalledWith({ status: 'REQUESTED' });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByPassenger', () => {
    it('should find rides by passenger id', async () => {
      const passengerId = 'passenger123';
      const passengerRides = [
        TestDataFactory.createRide({ passengerId }),
        TestDataFactory.createRide({ passengerId }),
      ];

      mockRideModel.find.mockResolvedValue(passengerRides);

      const result = await service.findByPassenger(passengerId);

      expect(mockRideModel.find).toHaveBeenCalledWith({ passengerId });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByDriver', () => {
    it('should find rides by driver id', async () => {
      const driverId = 'driver123';
      const driverRides = [
        TestDataFactory.createRide({ driverId }),
        TestDataFactory.createRide({ driverId }),
      ];

      mockRideModel.find.mockResolvedValue(driverRides);

      const result = await service.findByDriver(driverId);

      expect(mockRideModel.find).toHaveBeenCalledWith({ driverId });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('should update ride status with valid transition', async () => {
      const rideId = mockRide._id;
      const newStatus = 'ACCEPTED';
      const updatedRide = { ...mockRide, status: newStatus };

      mockRideModel.findByIdAndUpdate.mockResolvedValue(updatedRide);

      const result = await service.updateStatus(rideId, newStatus);

      expect(result.status).toBe(newStatus);
    });

    it('should throw error on invalid status transition', async () => {
      const rideId = mockRide._id;
      const ride = TestDataFactory.createRide({ status: 'COMPLETED' });

      mockRideModel.findById.mockResolvedValue(ride);

      await expect(
        service.updateStatus(rideId, 'REQUESTED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate allowed status transitions', async () => {
      const validTransitions = {
        REQUESTED: ['ACCEPTED', 'CANCELLED'],
        ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
        EN_ROUTE: ['ARRIVED'],
        ARRIVED: ['ONBOARD'],
        ONBOARD: ['DESTINATION'],
        DESTINATION: ['COMPLETED'],
        COMPLETED: [],
        CANCELLED: [],
      };

      const statuses = Object.keys(validTransitions);
      expect(statuses).toContain('REQUESTED');
      expect(statuses).toContain('COMPLETED');
    });
  });

  describe('findAll', () => {
    it('should return all rides', async () => {
      mockRideModel.find.mockResolvedValue(mockRideList);

      const result = await service.findAll();

      expect(mockRideModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockRideList);
    });
  });

  describe('update', () => {
    it('should update a ride', async () => {
      const rideId = mockRide._id;
      const updateRideDto = {
        fare: 50.0,
      };
      const updatedRide = { ...mockRide, ...updateRideDto };

      mockRideModel.findByIdAndUpdate.mockResolvedValue(updatedRide);

      const result = await service.update(rideId, updateRideDto);

      expect(mockRideModel.findByIdAndUpdate).toHaveBeenCalledWith(
        rideId,
        updateRideDto,
        { new: true },
      );
      expect(result.fare).toBe(updateRideDto.fare);
    });
  });

  describe('delete', () => {
    it('should delete a ride', async () => {
      const rideId = mockRide._id;

      mockRideModel.findByIdAndDelete.mockResolvedValue(mockRide);

      const result = await service.delete(rideId);

      expect(mockRideModel.findByIdAndDelete).toHaveBeenCalledWith(rideId);
      expect(result).toEqual(mockRide);
    });
  });

  describe('countRides', () => {
    it('should count total rides', async () => {
      mockRideModel.countDocuments.mockResolvedValue(100);

      const result = await service.countRides();

      expect(result).toBe(100);
    });

    it('should count rides by status', async () => {
      mockRideModel.countDocuments.mockResolvedValue(25);

      const result = await service.countRides('COMPLETED');

      expect(mockRideModel.countDocuments).toHaveBeenCalledWith({
        status: 'COMPLETED',
      });
      expect(result).toBe(25);
    });
  });
});
