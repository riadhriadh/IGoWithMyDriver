import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TestDataFactory, JwtTestUtils } from '../../test/test-utils';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let jwtTestUtils: JwtTestUtils;

  const mockUser = TestDataFactory.createUser({
    email: 'test@example.com',
    password: 'hashedPassword123',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRATION: '15m',
                REFRESH_TOKEN_EXPIRATION: '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    jwtTestUtils = new JwtTestUtils(jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        phone: '0612345678',
      };

      const createdUser = TestDataFactory.createUser({
        email: registerDto.email,
        name: registerDto.name,
      });

      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      (usersService.create as jest.Mock).mockResolvedValue(createdUser);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('accessToken123')
        .mockReturnValueOnce('refreshToken456');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if user already exists', async () => {
      const registerDto = {
        email: mockUser.email,
        password: 'Password123!',
        name: 'Test User',
        phone: '0612345678',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should hash password correctly', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'plainPassword123',
        name: 'Test User',
        phone: '0612345678',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      (usersService.create as jest.Mock).mockResolvedValue(
        TestDataFactory.createUser(),
      );
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'Password123!',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('accessToken123')
        .mockReturnValueOnce('refreshToken456');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw error if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if password is incorrect', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'WrongPassword123!',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const refreshTokenDto = {
        refreshToken: 'validRefreshToken123',
      };
      const userId = mockUser._id;

      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: userId,
        type: 'refresh',
      });
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const result = await service.refreshToken(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith('validRefreshToken123');
      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('accessToken', 'newAccessToken');
      expect(result).toHaveProperty('refreshToken', 'newRefreshToken');
    });

    it('should throw error with invalid refresh token', async () => {
      const refreshTokenDto = {
        refreshToken: 'invalidToken',
      };

      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = mockUser._id;
      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'password');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await service.validateUser(mockUser.email, 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
