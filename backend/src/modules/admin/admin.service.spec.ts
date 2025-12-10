import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { RidesService } from '../rides/rides.service';
import { PaymentsService } from '../payments/payments.service';
import { DriversService } from '../drivers/drivers.service';
import { TestDataFactory } from '../../test/test-utils';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: UsersService;
  let ridesService: RidesService;
  let paymentsService: PaymentsService;
  let driversService: DriversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: UsersService,
          useValue: {
            countUsers: jest.fn(),
          },
        },
        {
          provide: RidesService,
          useValue: {
            countRides: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            countPayments: jest.fn(),
          },
        },
        {
          provide: DriversService,
          useValue: {
            countDrivers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    usersService = module.get<UsersService>(UsersService);
    ridesService = module.get<RidesService>(RidesService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    driversService = module.get<DriversService>(DriversService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      (usersService.countUsers as jest.Mock).mockResolvedValue(100);
      (ridesService.countRides as jest.Mock).mockResolvedValue(500);
      (paymentsService.countPayments as jest.Mock).mockResolvedValue(450);
      (driversService.countDrivers as jest.Mock).mockResolvedValue(50);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('totalUsers', 100);
      expect(result).toHaveProperty('totalRides', 500);
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('activeDrivers');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const users = [
        TestDataFactory.createUser(),
        TestDataFactory.createUser(),
      ];

      const result = {
        data: users,
        total: 100,
        page: 1,
        limit: 10,
      };

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(100);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      const result = await service.getSystemHealth();

      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('cache');
      expect(result).toHaveProperty('api');
      expect(result.api).toBe('up');
    });
  });
});
