import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LocationService } from './location.service';
import { Location } from './schemas/location.schema';
import { TestDataFactory, TestAssertions } from '../../test/test-utils';

describe('LocationService', () => {
  let service: LocationService;
  let mockLocationModel: any;

  const mockLocation = TestDataFactory.createLocation();

  beforeEach(async () => {
    mockLocationModel = {
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
      lean: jest.fn(),
      countDocuments: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getModelToken(Location.name),
          useValue: mockLocationModel,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveLocation', () => {
    it('should save a location successfully', async () => {
      const createLocationDto = {
        userId: 'driver123',
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10.5,
        speed: 45.2,
        bearing: 180,
        batteryLevel: 85,
      };

      const expectedLocation = TestDataFactory.createLocation(
        createLocationDto,
      );

      mockLocationModel.create.mockResolvedValue(expectedLocation);

      const result = await service.saveLocation(createLocationDto);

      expect(mockLocationModel.create).toHaveBeenCalledWith(createLocationDto);
      expect(result).toEqual(expectedLocation);
    });

    it('should validate coordinates', async () => {
      const createLocationDto = {
        userId: 'driver123',
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10.5,
        speed: 45.2,
        bearing: 180,
        batteryLevel: 85,
      };

      TestAssertions.expectValidCoordinates([
        createLocationDto.longitude,
        createLocationDto.latitude,
      ]);

      mockLocationModel.create.mockResolvedValue(
        TestDataFactory.createLocation(createLocationDto),
      );

      const result = await service.saveLocation(createLocationDto);

      expect(result).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find a location by id', async () => {
      const locationId = mockLocation._id;

      mockLocationModel.findById.mockResolvedValue(mockLocation);

      const result = await service.findById(locationId);

      expect(mockLocationModel.findById).toHaveBeenCalledWith(locationId);
      expect(result).toEqual(mockLocation);
    });

    it('should return null if location not found', async () => {
      const locationId = 'nonexistentId';

      mockLocationModel.findById.mockResolvedValue(null);

      const result = await service.findById(locationId);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find locations by user id', async () => {
      const userId = 'driver123';
      const userLocations = [
        TestDataFactory.createLocation({ userId }),
        TestDataFactory.createLocation({ userId }),
        TestDataFactory.createLocation({ userId }),
      ];

      mockLocationModel.find.mockResolvedValue(userLocations);

      const result = await service.findByUserId(userId);

      expect(mockLocationModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toHaveLength(3);
    });

    it('should return empty array if user has no locations', async () => {
      const userId = 'newdriver';

      mockLocationModel.find.mockResolvedValue([]);

      const result = await service.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getLatestLocation', () => {
    it('should get latest location for user', async () => {
      const userId = 'driver123';
      const latestLocation = TestDataFactory.createLocation({
        userId,
        createdAt: new Date(),
      });

      mockLocationModel.findOne.mockResolvedValue(latestLocation);

      const result = await service.getLatestLocation(userId);

      expect(mockLocationModel.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(latestLocation);
    });
  });

  describe('getLocationHistory', () => {
    it('should get location history with limit', async () => {
      const userId = 'driver123';
      const limit = 10;
      const history = Array.from({ length: limit }, () =>
        TestDataFactory.createLocation({ userId }),
      );

      mockLocationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(history),
        }),
      });

      const result = await service.getLocationHistory(userId, limit);

      expect(result).toHaveLength(limit);
    });
  });

  describe('deleteLocationById', () => {
    it('should delete a location by id', async () => {
      const locationId = mockLocation._id;

      mockLocationModel.findByIdAndDelete.mockResolvedValue(mockLocation);

      const result = await service.deleteLocationById(locationId);

      expect(mockLocationModel.findByIdAndDelete).toHaveBeenCalledWith(
        locationId,
      );
      expect(result).toEqual(mockLocation);
    });
  });

  describe('deleteLocationsByUser', () => {
    it('should delete all locations for a user', async () => {
      const userId = 'driver123';

      mockLocationModel.deleteMany.mockResolvedValue({ deletedCount: 15 });

      await service.deleteLocationsByUser(userId);

      expect(mockLocationModel.deleteMany).toHaveBeenCalledWith({ userId });
    });
  });

  describe('countLocations', () => {
    it('should count total locations', async () => {
      mockLocationModel.countDocuments.mockResolvedValue(1000);

      const result = await service.countLocations();

      expect(result).toBe(1000);
    });

    it('should count locations by user', async () => {
      const userId = 'driver123';

      mockLocationModel.countDocuments.mockResolvedValue(50);

      const result = await service.countLocations(userId);

      expect(mockLocationModel.countDocuments).toHaveBeenCalledWith({ userId });
      expect(result).toBe(50);
    });
  });

  describe('getDistanceBetweenLocations', () => {
    it('should calculate distance between two locations', async () => {
      const loc1 = { latitude: 48.8566, longitude: 2.3522 };
      const loc2 = { latitude: 48.8600, longitude: 2.3600 };

      // Haversine formula distance (approximate)
      const distance = service.getDistanceBetweenLocations(loc1, loc2);

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100); // Less than 100 km
    });
  });
});
