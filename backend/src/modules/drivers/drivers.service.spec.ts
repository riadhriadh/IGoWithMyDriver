import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DriversService } from './drivers.service';
import { Driver } from './schemas/driver.schema';
import { TestDataFactory, TestAssertions } from '../../test/test-utils';

describe('DriversService', () => {
  let service: DriversService;
  let mockDriverModel: any;

  const mockDriver = TestDataFactory.createDriver({
    status: 'available',
  });

  beforeEach(async () => {
    mockDriverModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
      lean: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getModelToken(Driver.name),
          useValue: mockDriverModel,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDriver', () => {
    it('should create a driver successfully', async () => {
      const createDriverDto = {
        userId: 'user123',
        licenseNumber: 'DL123456',
        licenseExpiry: new Date('2025-12-31'),
        vehicleRegistration: 'VR123456',
        vehicleModel: 'Toyota Prius',
        vehicleColor: 'White',
      };

      const expectedDriver = TestDataFactory.createDriver(createDriverDto);

      mockDriverModel.create.mockResolvedValue(expectedDriver);

      const result = await service.createDriver(createDriverDto);

      expect(mockDriverModel.create).toHaveBeenCalled();
      expect(result.status).toBe('available');
    });
  });

  describe('findById', () => {
    it('should find a driver by id', async () => {
      const driverId = mockDriver._id;

      mockDriverModel.findById.mockResolvedValue(mockDriver);

      const result = await service.findById(driverId);

      expect(mockDriverModel.findById).toHaveBeenCalledWith(driverId);
      expect(result).toEqual(mockDriver);
    });
  });

  describe('findByUserId', () => {
    it('should find a driver by user id', async () => {
      const userId = 'user123';

      mockDriverModel.findOne.mockResolvedValue(mockDriver);

      const result = await service.findByUserId(userId);

      expect(mockDriverModel.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockDriver);
    });
  });

  describe('findNearby', () => {
    it('should find nearby drivers within max distance', async () => {
      const latitude = 48.8566;
      const longitude = 2.3522;
      const maxDistance = 5000; // 5km

      const nearbyDrivers = [
        TestDataFactory.createDriver({
          currentLocation: {
            type: 'Point',
            coordinates: [2.3522, 48.8566],
          },
        }),
        TestDataFactory.createDriver({
          currentLocation: {
            type: 'Point',
            coordinates: [2.3600, 48.8600],
          },
        }),
      ];

      mockDriverModel.find.mockResolvedValue(nearbyDrivers);

      const result = await service.findNearby(latitude, longitude, maxDistance);

      expect(result).toHaveLength(2);
      expect(mockDriverModel.find).toHaveBeenCalled();
    });

    it('should return empty array if no drivers nearby', async () => {
      const latitude = 48.8566;
      const longitude = 2.3522;
      const maxDistance = 1000;

      mockDriverModel.find.mockResolvedValue([]);

      const result = await service.findNearby(latitude, longitude, maxDistance);

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find drivers by status', async () => {
      const availableDrivers = [
        TestDataFactory.createDriver({ status: 'available' }),
        TestDataFactory.createDriver({ status: 'available' }),
      ];

      mockDriverModel.find.mockResolvedValue(availableDrivers);

      const result = await service.findByStatus('available');

      expect(mockDriverModel.find).toHaveBeenCalledWith({
        status: 'available',
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('updateLocation', () => {
    it('should update driver location', async () => {
      const driverId = mockDriver._id;
      const newLocation = {
        type: 'Point',
        coordinates: [2.4000, 48.9000],
      };
      const updatedDriver = { ...mockDriver, currentLocation: newLocation };

      mockDriverModel.findByIdAndUpdate.mockResolvedValue(updatedDriver);

      const result = await service.updateLocation(driverId, newLocation);

      expect(mockDriverModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result.currentLocation).toEqual(newLocation);
    });
  });

  describe('updateStatus', () => {
    it('should update driver status', async () => {
      const driverId = mockDriver._id;
      const newStatus = 'busy';
      const updatedDriver = { ...mockDriver, status: newStatus };

      mockDriverModel.findByIdAndUpdate.mockResolvedValue(updatedDriver);

      const result = await service.updateStatus(driverId, newStatus);

      expect(result.status).toBe(newStatus);
    });
  });

  describe('updateRating', () => {
    it('should update driver rating', async () => {
      const driverId = mockDriver._id;
      const newRating = 4.8;
      const updatedDriver = { ...mockDriver, rating: newRating };

      mockDriverModel.findByIdAndUpdate.mockResolvedValue(updatedDriver);

      const result = await service.updateRating(driverId, newRating);

      expect(result.rating).toBe(newRating);
    });
  });

  describe('update', () => {
    it('should update driver information', async () => {
      const driverId = mockDriver._id;
      const updateDriverDto = {
        vehicleModel: 'Tesla Model 3',
        vehicleColor: 'Black',
      };
      const updatedDriver = { ...mockDriver, ...updateDriverDto };

      mockDriverModel.findByIdAndUpdate.mockResolvedValue(updatedDriver);

      const result = await service.update(driverId, updateDriverDto);

      expect(mockDriverModel.findByIdAndUpdate).toHaveBeenCalledWith(
        driverId,
        updateDriverDto,
        { new: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete a driver', async () => {
      const driverId = mockDriver._id;

      mockDriverModel.findByIdAndDelete.mockResolvedValue(mockDriver);

      const result = await service.delete(driverId);

      expect(mockDriverModel.findByIdAndDelete).toHaveBeenCalledWith(
        driverId,
      );
      expect(result).toEqual(mockDriver);
    });
  });

  describe('countDrivers', () => {
    it('should count total drivers', async () => {
      mockDriverModel.countDocuments.mockResolvedValue(50);

      const result = await service.countDrivers();

      expect(result).toBe(50);
    });

    it('should count drivers by status', async () => {
      mockDriverModel.countDocuments.mockResolvedValue(30);

      const result = await service.countDrivers('available');

      expect(mockDriverModel.countDocuments).toHaveBeenCalledWith({
        status: 'available',
      });
      expect(result).toBe(30);
    });
  });
});
