import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { TestDataFactory, TestAssertions } from '../../test/test-utils';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockUser = TestDataFactory.createUser({
    email: 'test@example.com',
  });

  const mockUserList = [
    mockUser,
    TestDataFactory.createUser({ email: 'user2@example.com' }),
  ];

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
      lean: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'hashedPassword123',
        name: 'New User',
        phone: '0612345678',
        role: 'passenger',
      };

      const expectedUser = TestDataFactory.createUser(createUserDto);

      mockUserModel.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });

    it('should handle creation error', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'hashedPassword123',
        name: 'New User',
        phone: '0612345678',
      };

      mockUserModel.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const userId = mockUser._id;

      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const userId = 'nonexistentId';

      mockUserModel.findById.mockResolvedValue(null);

      const result = await service.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = mockUser.email;

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should return null if email not found', async () => {
      const email = 'nonexistent@example.com';

      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUserModel.find.mockResolvedValue(mockUserList);

      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockUserList);
      expect(result).toHaveLength(2);
    });

    it('should handle empty user list', async () => {
      mockUserModel.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const driverUsers = [
        TestDataFactory.createUser({ role: 'driver' }),
        TestDataFactory.createUser({ role: 'driver' }),
      ];

      mockUserModel.find.mockResolvedValue(driverUsers);

      const result = await service.findByRole('driver');

      expect(mockUserModel.find).toHaveBeenCalledWith({ role: 'driver' });
      expect(result).toHaveLength(2);
      expect(result.every((user) => user.role === 'driver')).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = mockUser._id;
      const updateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateUserDto };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        { new: true },
      );
      expect(result.name).toBe(updateUserDto.name);
    });

    it('should return null if user not found during update', async () => {
      const userId = 'nonexistentId';
      const updateUserDto = { name: 'Updated Name' };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      const result = await service.update(userId, updateUserDto);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = mockUser._id;

      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await service.delete(userId);

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found during delete', async () => {
      const userId = 'nonexistentId';

      mockUserModel.findByIdAndDelete.mockResolvedValue(null);

      const result = await service.delete(userId);

      expect(result).toBeNull();
    });
  });

  describe('countUsers', () => {
    it('should count total users', async () => {
      mockUserModel.countDocuments.mockResolvedValue(10);

      const result = await service.countUsers();

      expect(result).toBe(10);
    });

    it('should count users by role', async () => {
      mockUserModel.countDocuments.mockResolvedValue(5);

      const result = await service.countUsers('driver');

      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({
        role: 'driver',
      });
      expect(result).toBe(5);
    });
  });
});
