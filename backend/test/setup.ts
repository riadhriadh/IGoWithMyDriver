require('dotenv').config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRATION = '15m';
process.env.REFRESH_TOKEN_EXPIRATION = '7d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/taxi-vtc-test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Cleanup after tests
afterAll(() => {
  jest.clearAllMocks();
});
