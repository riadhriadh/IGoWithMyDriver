import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RatingsService } from './ratings.service';
import { Rating } from './schemas/rating.schema';
import { TestDataFactory } from '../../test/test-utils';

describe('RatingsService', () => {
  let service: RatingsService;
  let mockRatingModel: any;

  const mockRating = TestDataFactory.createRating({
    rating: 5,
  });

  beforeEach(async () => {
    mockRatingModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getModelToken(Rating.name),
          useValue: mockRatingModel,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRating', () => {
    it('should create a rating successfully', async () => {
      const createRatingDto = {
        rideId: 'ride123',
        fromUserId: 'passenger123',
        toUserId: 'driver123',
        rating: 5,
        comment: 'Great driver!',
      };

      mockRatingModel.create.mockResolvedValue(
        TestDataFactory.createRating(createRatingDto),
      );

      const result = await service.createRating(createRatingDto);

      expect(mockRatingModel.create).toHaveBeenCalled();
      expect(result.rating).toBe(5);
    });
  });

  describe('getAverageRating', () => {
    it('should calculate average rating for user', async () => {
      mockRatingModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ avgRating: 4.5 }]),
      });

      const result = await service.getAverageRating('user123');

      expect(result).toBe(4.5);
    });
  });

  describe('getRatingsByUser', () => {
    it('should get ratings for a user', async () => {
      const ratings = [
        TestDataFactory.createRating(),
        TestDataFactory.createRating(),
      ];

      mockRatingModel.find.mockResolvedValue(ratings);

      const result = await service.getRatingsByUser('user123');

      expect(result).toHaveLength(2);
    });
  });

  describe('countRatings', () => {
    it('should count total ratings', async () => {
      mockRatingModel.countDocuments.mockResolvedValue(500);

      const result = await service.countRatings();

      expect(result).toBe(500);
    });
  });
});
