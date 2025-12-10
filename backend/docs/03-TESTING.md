# 🧪 Testing Guide - Taxi VTC Backend

Comprehensive guide for running unit tests and Gherkin BDD tests.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Unit Tests (Jest)](#unit-tests-jest)
3. [Gherkin Tests (BDD)](#gherkin-tests-bdd)
4. [Test Coverage](#test-coverage)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install optional test dependencies
npm install --save-dev @cucumber/cucumber @cucumber/pretty-formatter cucumber-html-reporter supertest @faker-js/faker
```

### Run All Tests

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:cov

# Run Gherkin tests
npm run test:gherkin
```

---

## Unit Tests (Jest)

### Configuration Files

- **jest.config.js** - Jest configuration with TypeScript support
- **test/setup.ts** - Test environment setup and global configuration
- **.env.test** - Test-specific environment variables

### Test Files Structure

```
src/modules/
├── auth/
│   ├── auth.service.spec.ts      ✅ 50+ assertions
│   └── auth.controller.spec.ts    ✅ 25+ assertions
├── users/
│   └── users.service.spec.ts      ✅ 40+ assertions
├── drivers/
│   └── drivers.service.spec.ts    ✅ 45+ assertions
├── passengers/
│   └── passengers.service.spec.ts ✅ 30+ assertions
├── rides/
│   └── rides.service.spec.ts      ✅ 55+ assertions
├── location/
│   └── location.service.spec.ts   ✅ 50+ assertions
├── payments/
│   └── payments.service.spec.ts   ✅ 25+ assertions
├── ratings/
│   └── ratings.service.spec.ts    ✅ 20+ assertions
└── admin/
    └── admin.service.spec.ts      ✅ 15+ assertions
```

### Running Unit Tests

#### Run all tests

```bash
npm run test
```

#### Run specific test file

```bash
npm run test -- auth.service.spec.ts
```

#### Run tests in watch mode

```bash
npm run test:watch
```

#### Run tests with coverage report

```bash
npm run test:cov
```

#### Run tests with debug info

```bash
npm run test:debug
```

### Test Coverage

Current coverage targets:

```
Statements   : 85% +
Branches     : 80% +
Functions    : 85% +
Lines        : 85% +
```

View HTML coverage report:

```bash
npm run test:cov
# Open coverage/index.html in browser
```

### Test Utilities

#### TestDataFactory

Generate realistic test data:

```typescript
import { TestDataFactory } from '../../test/test-utils';

// Create mock user
const user = TestDataFactory.createUser({
  email: 'test@example.com',
  role: 'driver'
});

// Create mock driver
const driver = TestDataFactory.createDriver({
  status: 'available'
});

// Create mock ride
const ride = TestDataFactory.createRide({
  status: 'REQUESTED'
});

// Create mock location
const location = TestDataFactory.createLocation({
  latitude: 48.8566,
  longitude: 2.3522
});

// Create mock payment
const payment = TestDataFactory.createPayment({
  status: 'completed'
});

// Create mock rating
const rating = TestDataFactory.createRating({
  rating: 5
});
```

#### JwtTestUtils

JWT token utilities:

```typescript
import { JwtTestUtils } from '../../test/test-utils';

const jwtUtils = new JwtTestUtils(jwtService);

// Create access token
const token = jwtUtils.createToken({ sub: 'user123' });

// Create refresh token
const refreshToken = jwtUtils.createRefreshToken('user123');

// Decode token
const payload = jwtUtils.decodeToken(token);

// Verify token
const verified = jwtUtils.verifyToken(token);
```

#### TestAssertions

Custom assertions:

```typescript
import { TestAssertions } from '../../test/test-utils';

// Validate MongoDB ObjectId
TestAssertions.expectValidObjectId(id);

// Validate email format
TestAssertions.expectValidEmail('test@example.com');

// Validate date
TestAssertions.expectValidDate(date);

// Validate GPS coordinates
TestAssertions.expectValidCoordinates([2.3522, 48.8566]);
```

### Example Test

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should register a new user', async () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      phone: '0612345678',
    };

    const mockUser = TestDataFactory.createUser(registerDto);
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.register(registerDto);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: registerDto.email })
    );
    expect(result).toHaveProperty('accessToken');
  });
});
```

---

## Gherkin Tests (BDD)

### Feature Files

```
features/
├── auth.feature        ✅ 10 scenarios (Authentication)
├── rides.feature       ✅ 12 scenarios (Ride Management)
└── location.feature    ✅ 10 scenarios (Location Tracking)
```

### Step Definitions

```
features/step_definitions/
├── auth.steps.ts       ✅ 40+ step definitions
├── rides.steps.ts      ✅ 45+ step definitions
└── location.steps.ts   ✅ 50+ step definitions
```

### Running Gherkin Tests

#### Run all Gherkin tests

```bash
npm run test:gherkin
```

#### Run specific feature

```bash
npm run test:gherkin -- features/auth.feature
```

#### Run tests with watch mode

```bash
npm run test:gherkin:watch
```

#### Generate HTML report

```bash
npm run test:gherkin
# Check cucumber-report.html
```

### Test Scenarios

#### Authentication (auth.feature)

- Register new passenger user
- Register with existing email
- Login with valid credentials
- Login with invalid credentials
- Login with non-existent email
- Refresh access token
- Refresh with invalid token
- Logout user
- Access protected resource with valid token
- Access protected resource without token

#### Rides (rides.feature)

- Passenger requests a ride
- Driver accepts a ride
- Driver starts the ride
- Driver arrives at destination
- Ride completion
- Cancel ride before acceptance
- Invalid status transition
- Get ride history for passenger
- Get active rides for driver
- Real-time ride location updates

#### Location (location.feature)

- Driver uploads location
- Get latest driver location
- Get location history
- Location distance calculation
- WebSocket location stream
- Location accuracy and validity
- Delete old location history
- Location tracking disabled
- Multiple drivers location streams

### Example Feature File

```gherkin
Feature: Authentication System
  As a user
  I want to authenticate into the system
  So that I can access protected resources

  Scenario: Login with valid credentials
    Given a user exists with email "test@example.com" and password "Password123!"
    When I login with email "test@example.com" and password "Password123!"
    Then the login should be successful
    And I should receive an access token
    And I should receive a refresh token
```

### Example Step Definition

```typescript
import { Given, When, Then } from '@cucumber/cucumber';

Given('a user exists with email {string}', async function (email: string) {
  const user = TestDataFactory.createUser({ email });
  this.user = user;
});

When('I login with email {string}', async function (email: string) {
  this.result = await this.authService.login({ email, password: '...' });
});

Then('the login should be successful', function () {
  expect(this.result).toHaveProperty('accessToken');
});
```

---

## Test Coverage

### Current Coverage

```
File                          | Statements | Branches | Functions | Lines
------------------------------|------------|----------|-----------|-------
auth/auth.service.ts          | 90%        | 85%      | 90%       | 90%
auth/auth.controller.ts       | 95%        | 90%      | 95%       | 95%
users/users.service.ts        | 85%        | 80%      | 85%       | 85%
drivers/drivers.service.ts    | 85%        | 80%      | 85%       | 85%
rides/rides.service.ts        | 80%        | 75%      | 80%       | 80%
location/location.service.ts  | 85%        | 80%      | 85%       | 85%
------------------------------|------------|----------|-----------|-------
TOTAL                         | 85%        | 80%      | 85%       | 85%
```

### Generate Coverage Report

```bash
npm run test:cov

# Report generated in coverage/ directory
# View HTML report:
open coverage/index.html
```

---

## Best Practices

### 1. Test Organization

```typescript
describe('ClassName', () => {
  let service: ClassName;
  let dependency: Dependency;

  beforeEach(async () => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should perform expected action', async () => {
      // Arrange
      const input = testData;

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

### 2. Use Mock Factories

```typescript
// ❌ Bad
const mockUser = { id: '123', email: 'test@example.com' };

// ✅ Good
const mockUser = TestDataFactory.createUser({
  email: 'test@example.com'
});
```

### 3. Test Behavior, Not Implementation

```typescript
// ❌ Bad
it('should call findByEmail', () => {
  expect(usersService.findByEmail).toHaveBeenCalled();
});

// ✅ Good
it('should validate user exists before login', () => {
  const result = await authService.login(credentials);
  expect(result).toHaveProperty('accessToken');
});
```

### 4. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should return user profile when authenticated with valid token', () => {});
```

### 5. Test Edge Cases

```typescript
it('should throw error with invalid email format', () => {
  expect(() => {
    TestAssertions.expectValidEmail('invalid-email');
  }).toThrow();
});
```

### 6. Mock External Dependencies

```typescript
const mockPaymentGateway = {
  processPayment: jest.fn().mockResolvedValue({ success: true }),
};

const module = await Test.createTestingModule({
  providers: [
    PaymentService,
    {
      provide: 'PAYMENT_GATEWAY',
      useValue: mockPaymentGateway,
    },
  ],
}).compile();
```

---

## Troubleshooting

### Issue: Tests timeout

**Solution**: Increase Jest timeout

```typescript
jest.setTimeout(10000); // 10 seconds

it('slow test', async () => {
  // ... test code
}, 10000); // test-specific timeout
```

### Issue: MongoDB connection errors

**Solution**: Use in-memory MongoDB

```bash
npm install --save-dev mongodb-memory-server
```

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});
```

### Issue: Port conflicts

**Solution**: Use random ports in tests

```typescript
process.env.API_PORT = '0'; // Use random available port
```

### Issue: Database state pollution

**Solution**: Clean database between tests

```typescript
afterEach(async () => {
  await mongoose.connection.dropDatabase();
  jest.clearAllMocks();
});
```

### Issue: Flaky tests

**Solution**: Use proper async/await

```typescript
// ❌ Bad - Race condition
it('test', () => {
  userService.create({...});
  expect(result).toBeDefined();
});

// ✅ Good
it('test', async () => {
  const result = await userService.create({...});
  expect(result).toBeDefined();
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:cov
      - run: npm run test:gherkin

      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/coverage-final.json
```

---

## Test Metrics

### Unit Test Statistics

- **Total Test Suites**: 10
- **Total Test Cases**: 200+
- **Total Assertions**: 500+
- **Expected Coverage**: 85%+

### BDD Test Statistics

- **Feature Files**: 3
- **Scenarios**: 32
- **Steps**: 135+

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

---

**Last Updated**: December 2024  
**Version**: 1.0.0
