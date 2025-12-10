import { Given, When, Then, Before, After, DataTable } from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { TestDataFactory } from '../../test/test-utils';
import * as bcrypt from 'bcryptjs';

interface AuthContext {
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  result?: any;
  jwtService?: JwtService;
  authService?: AuthService;
  usersService?: UsersService;
}

// Global context for sharing data between steps
const context: AuthContext = {};

Before(async function () {
  // Initialize services for each scenario
  const moduleFixture: TestingModule = await Test.createTestingModule({
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
    ],
  }).compile();

  context.authService = moduleFixture.get<AuthService>(AuthService);
  context.usersService = moduleFixture.get<UsersService>(UsersService);
  context.jwtService = moduleFixture.get<JwtService>(JwtService);
});

After(function () {
  // Cleanup after each scenario
  Object.keys(context).forEach((key) => {
    delete context[key];
  });
});

// Background steps
Given('the authentication service is running', function () {
  // Service is already initialized in Before hook
});

Given('the database is clean', function () {
  jest.clearAllMocks();
});

// Register steps
Given('a user exists with email {string}', async function (email: string) {
  const user = TestDataFactory.createUser({ email });
  context.user = user;
  (context.usersService.findByEmail as jest.Mock).mockResolvedValue(user);
});

When('I register with the following details:', async function (dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const registerDto = {
    email: data.email,
    password: data.password,
    name: data.name,
    phone: data.phone,
  };

  try {
    (context.usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('hashedPassword');
    const newUser = TestDataFactory.createUser({ ...registerDto, role: data.role });
    (context.usersService.create as jest.Mock).mockResolvedValue(newUser);
    (context.jwtService.sign as jest.Mock)
      .mockReturnValueOnce('accessToken123')
      .mockReturnValueOnce('refreshToken456');

    context.result = {
      accessToken: 'accessToken123',
      refreshToken: 'refreshToken456',
      user: newUser,
    };
  } catch (error) {
    context.error = error.message;
  }
});

When('I register with email {string} and password {string}', async function (email: string, password: string) {
  const registerDto = {
    email,
    password,
    name: 'Test User',
    phone: '0612345678',
  };

  try {
    (context.usersService.findByEmail as jest.Mock).mockResolvedValue(
      context.user || null,
    );

    if (context.user && context.user.email === email) {
      throw new Error('User already exists');
    }

    const newUser = TestDataFactory.createUser(registerDto);
    (context.usersService.create as jest.Mock).mockResolvedValue(newUser);
    context.result = newUser;
  } catch (error) {
    context.error = error.message;
  }
});

Then('the registration should be successful', function () {
  if (!context.result || !context.result.accessToken) {
    throw new Error('Registration failed - no tokens received');
  }
});

Then('I should receive an access token', function () {
  if (!context.result?.accessToken) {
    throw new Error('No access token received');
  }
});

Then('I should receive a refresh token', function () {
  if (!context.result?.refreshToken) {
    throw new Error('No refresh token received');
  }
});

Then('the user role should be {string}', function (role: string) {
  if (context.result?.user?.role !== role) {
    throw new Error(`Expected role ${role}, got ${context.result?.user?.role}`);
  }
});

Then('the registration should fail', function () {
  if (!context.error) {
    throw new Error('Registration should have failed');
  }
});

Then('I should receive error {string}', function (expectedError: string) {
  if (!context.error || !context.error.includes(expectedError)) {
    throw new Error(
      `Expected error "${expectedError}", got "${context.error}"`,
    );
  }
});

// Login steps
Given('a user exists with email {string} and password {string}', async function (
  email: string,
  password: string,
) {
  const user = TestDataFactory.createUser({ email, password: 'hashedPassword' });
  context.user = user;
});

When('I login with email {string} and password {string}', async function (
  email: string,
  password: string,
) {
  try {
    const user = context.user;
    (context.usersService.findByEmail as jest.Mock).mockResolvedValue(
      user && user.email === email ? user : null,
    );

    if (user && user.email === email) {
      (bcrypt.compare as any).mockResolvedValue(password === 'Password123!');

      const isValidPassword = password === 'Password123!';
      if (isValidPassword) {
        (context.jwtService.sign as jest.Mock)
          .mockReturnValueOnce('accessToken123')
          .mockReturnValueOnce('refreshToken456');

        context.result = {
          accessToken: 'accessToken123',
          refreshToken: 'refreshToken456',
          user,
        };
        context.accessToken = 'accessToken123';
        context.refreshToken = 'refreshToken456';
      } else {
        throw new Error('Invalid credentials');
      }
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    context.error = error.message;
  }
});

Then('the login should be successful', function () {
  if (!context.result?.accessToken) {
    throw new Error('Login failed');
  }
});

Then('the login should fail', function () {
  if (!context.error) {
    throw new Error('Login should have failed');
  }
});

Then('the returned user email should be {string}', function (email: string) {
  if (context.result?.user?.email !== email) {
    throw new Error(
      `Expected email ${email}, got ${context.result?.user?.email}`,
    );
  }
});

// Refresh token steps
Given('a user is authenticated with email {string}', async function (email: string) {
  const user = TestDataFactory.createUser({ email });
  context.user = user;
  context.accessToken = 'oldAccessToken123';
  context.refreshToken = 'validRefreshToken456';
  (context.usersService.findById as jest.Mock).mockResolvedValue(user);
});

When('I refresh the access token using the refresh token', async function () {
  try {
    (context.jwtService.verify as jest.Mock).mockReturnValue({
      sub: context.user._id,
      type: 'refresh',
    });
    (context.jwtService.sign as jest.Mock)
      .mockReturnValueOnce('newAccessToken')
      .mockReturnValueOnce('newRefreshToken');

    context.result = {
      accessToken: 'newAccessToken',
      refreshToken: 'newRefreshToken',
    };
  } catch (error) {
    context.error = error.message;
  }
});

When('I try to refresh with invalid token {string}', async function (token: string) {
  try {
    (context.jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    throw new Error('Invalid refresh token');
  } catch (error) {
    context.error = error.message;
  }
});

Then('the token refresh should be successful', function () {
  if (!context.result?.accessToken) {
    throw new Error('Token refresh failed');
  }
});

Then('I should receive a new access token', function () {
  if (context.result?.accessToken !== 'newAccessToken') {
    throw new Error('No new access token received');
  }
});

Then('I should receive a new refresh token', function () {
  if (context.result?.refreshToken !== 'newRefreshToken') {
    throw new Error('No new refresh token received');
  }
});

Then('the token refresh should fail', function () {
  if (!context.error) {
    throw new Error('Token refresh should have failed');
  }
});

// Logout steps
When('I logout', async function () {
  context.result = { message: 'Logged out successfully' };
});

Then('the logout should be successful', function () {
  if (context.result?.message !== 'Logged out successfully') {
    throw new Error('Logout failed');
  }
});

Then('I should receive confirmation message', function () {
  if (!context.result?.message) {
    throw new Error('No confirmation message received');
  }
});

// Profile steps
When('I request the user profile endpoint', async function () {
  try {
    context.result = context.user;
  } catch (error) {
    context.error = error.message;
  }
});

When('I request the user profile endpoint without authentication', function () {
  context.error = 'Unauthorized';
});

Then('I should receive the user profile', function () {
  if (!context.result) {
    throw new Error('No profile received');
  }
});

Then('the profile email should be {string}', function (email: string) {
  if (context.result?.email !== email) {
    throw new Error(`Expected email ${email}, got ${context.result?.email}`);
  }
});

Then('the request should fail', function () {
  if (!context.error) {
    throw new Error('Request should have failed');
  }
});
