import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TestDataFactory } from '../../test/test-utils';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = TestDataFactory.createAuthToken();
  const mockUser = TestDataFactory.createUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and return tokens', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        phone: '0612345678',
      };

      (service.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const loginResponse = {
        accessToken: mockAuthResponse.accessToken,
        refreshToken: mockAuthResponse.refreshToken,
        user: mockUser,
      };

      (service.login as jest.Mock).mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('refreshToken', () => {
    it('should refresh user tokens', async () => {
      const refreshDto = { refreshToken: 'oldRefreshToken' };

      (service.refreshToken as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(refreshDto);

      expect(service.refreshToken).toHaveBeenCalledWith(refreshDto);
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const mockRequest = { user: { sub: mockUser._id } };
      const logoutResponse = { message: 'Logged out successfully' };

      (service.logout as jest.Mock).mockResolvedValue(logoutResponse);

      const result = await controller.logout(mockRequest);

      expect(service.logout).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(logoutResponse);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockRequest = { user: mockUser };

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });
});
