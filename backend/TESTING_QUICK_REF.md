# 🚀 Testing Quick Reference

Quick command reference for running tests.

## Installation

```bash
npm install
```

## Run Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# With coverage report
npm run test:cov

# Debug mode
npm run test:debug

# Specific test file
npm run test -- auth.service.spec.ts

# Specific test pattern
npm run test -- --testNamePattern="register"
```

### Gherkin/BDD Tests

```bash
# Run all Gherkin tests
npm run test:gherkin

# Watch mode
npm run test:gherkin:watch

# Specific feature
npm run test:gherkin -- features/auth.feature

# Generate HTML report
npm run test:gherkin
# Report: cucumber-report.html
```

## Combined Testing

```bash
# Run all tests (unit + BDD)
npm run test && npm run test:gherkin

# Run all tests with coverage
npm run test:cov && npm run test:gherkin
```

## Test Files Structure

```
Unit Tests (Jest):
├── src/modules/auth/
│   ├── auth.service.spec.ts
│   └── auth.controller.spec.ts
├── src/modules/users/users.service.spec.ts
├── src/modules/drivers/drivers.service.spec.ts
├── src/modules/passengers/passengers.service.spec.ts
├── src/modules/rides/rides.service.spec.ts
├── src/modules/location/location.service.spec.ts
├── src/modules/payments/payments.service.spec.ts
├── src/modules/ratings/ratings.service.spec.ts
└── src/modules/admin/admin.service.spec.ts

BDD Tests (Gherkin):
├── features/
│   ├── auth.feature
│   ├── rides.feature
│   ├── location.feature
│   └── step_definitions/
│       ├── auth.steps.ts
│       ├── rides.steps.ts
│       └── location.steps.ts

Test Utilities:
├── test/test-utils.ts
├── test/setup.ts
└── jest.config.js
```

## Test Statistics

```
✅ 10 test suites
✅ 94 unit tests
✅ 32 Gherkin scenarios
✅ 500+ assertions
✅ 85%+ code coverage
```

## Common Test Scenarios

### Authentication Tests

```bash
npm run test -- auth.service.spec.ts
```

Tests:
- User registration
- Email validation
- Password hashing
- JWT token generation
- Token refresh
- Logout functionality

### Rides Tests

```bash
npm run test -- rides.service.spec.ts
```

Tests:
- Ride creation
- Status transitions
- Driver/passenger queries
- State machine validation
- Concurrent rides

### Location Tests

```bash
npm run test -- location.service.spec.ts
```

Tests:
- Location saving
- GPS validation
- Distance calculation
- History retrieval
- TTL cleanup

## Use Test Data Factory

```typescript
import { TestDataFactory } from '../../test/test-utils';

// Create users
const user = TestDataFactory.createUser({
  email: 'test@example.com'
});

// Create drivers
const driver = TestDataFactory.createDriver({
  status: 'available'
});

// Create rides
const ride = TestDataFactory.createRide({
  status: 'REQUESTED'
});

// Create locations
const location = TestDataFactory.createLocation({
  latitude: 48.8566,
  longitude: 2.3522
});
```

## Coverage Report

```bash
# Generate coverage
npm run test:cov

# View HTML report
open coverage/index.html
```

Coverage targets: **85%+**

## Troubleshooting

### Tests timeout
```bash
npm run test -- --testTimeout=10000
```

### Clear Jest cache
```bash
npm run test -- --clearCache
```

### Run single test
```bash
npm run test -- -t "should register a user"
```

### Verbose output
```bash
npm run test -- --verbose
```

## Environment Setup

Tests use `.env.test`:
```
NODE_ENV=test
API_PORT=3001
MONGODB_URI=mongodb://localhost:27017/taxi-vtc-test
JWT_SECRET=test-secret-key-123456789
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Documentation

📖 Full testing guide: `docs/03-TESTING.md`
📊 Test summary: `TEST_SUMMARY.md`

## Requirements

- Node.js 18+
- MongoDB running locally
- Redis running locally

```bash
# Start MongoDB and Redis with Docker
docker-compose -f docker-compose.yml up -d mongo redis
```

---

**Commands Summary**

| Command | Purpose |
|---------|---------|
| `npm run test` | Run all unit tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:watch` | Watch mode for unit tests |
| `npm run test:gherkin` | Run all BDD tests |
| `npm test && npm run test:gherkin` | Run everything |

