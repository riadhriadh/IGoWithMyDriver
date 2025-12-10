import { JwtService } from '@nestjs/jwt';
import { faker } from '@faker-js/faker';

/**
 * Utilitaires pour générer des données de test
 */
export class TestDataFactory {
  static createUser(overrides?: Partial<any>) {
    return {
      _id: faker.database.mongodbObjectId(),
      email: faker.internet.email(),
      password: 'hashedPassword123',
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      role: 'passenger',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createDriver(overrides?: Partial<any>) {
    return {
      _id: faker.database.mongodbObjectId(),
      userId: faker.database.mongodbObjectId(),
      licenseNumber: `DL${faker.string.alphaNumeric(10)}`,
      licenseExpiry: faker.date.future(),
      vehicleRegistration: `VR${faker.string.alphaNumeric(10)}`,
      vehicleModel: faker.vehicle.model(),
      vehicleColor: faker.vehicle.color(),
      rating: 4.5,
      totalRides: 150,
      status: 'available',
      currentLocation: {
        type: 'Point',
        coordinates: [2.3522, 48.8566], // Paris
      },
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createPassenger(overrides?: Partial<any>) {
    return {
      _id: faker.database.mongodbObjectId(),
      userId: faker.database.mongodbObjectId(),
      preferredPaymentMethod: 'card',
      emergencyContact: faker.person.fullName(),
      emergencyPhone: faker.phone.number(),
      rating: 4.8,
      totalRides: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createRide(overrides?: Partial<any>) {
    const pickupLocation = [
      faker.number.float({ min: 2.0, max: 2.5, precision: 0.0001 }),
      faker.number.float({ min: 48.5, max: 49.0, precision: 0.0001 }),
    ];
    const dropoffLocation = [
      faker.number.float({ min: 2.0, max: 2.5, precision: 0.0001 }),
      faker.number.float({ min: 48.5, max: 49.0, precision: 0.0001 }),
    ];

    return {
      _id: faker.database.mongodbObjectId(),
      passengerId: faker.database.mongodbObjectId(),
      driverId: faker.database.mongodbObjectId(),
      pickupLocation: {
        type: 'Point',
        coordinates: pickupLocation,
        address: faker.location.streetAddress(),
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: dropoffLocation,
        address: faker.location.streetAddress(),
      },
      status: 'REQUESTED',
      fare: faker.number.float({ min: 10, max: 100, precision: 0.01 }),
      distance: faker.number.float({ min: 1, max: 50, precision: 0.1 }),
      estimatedDuration: faker.number.int({ min: 5, max: 60 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createLocation(overrides?: Partial<any>) {
    return {
      _id: faker.database.mongodbObjectId(),
      userId: faker.database.mongodbObjectId(),
      latitude: faker.number.float({ min: 48.5, max: 49.0, precision: 0.0001 }),
      longitude: faker.number.float({ min: 2.0, max: 2.5, precision: 0.0001 }),
      accuracy: faker.number.float({ min: 5, max: 30, precision: 0.1 }),
      speed: faker.number.float({ min: 0, max: 120, precision: 0.1 }),
      bearing: faker.number.int({ min: 0, max: 360 }),
      batteryLevel: faker.number.int({ min: 10, max: 100 }),
      isCharging: false,
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createPayment(overrides?: Partial<any>) {
    return {
      _id: faker.database.mongodbObjectId(),
      rideId: faker.database.mongodbObjectId(),
      passengerId: faker.database.mongodbObjectId(),
      driverId: faker.database.mongodbObjectId(),
      amount: faker.number.float({ min: 10, max: 200, precision: 0.01 }),
      currency: 'EUR',
      method: 'card',
      status: 'completed',
      transactionId: `TXN${faker.string.alphaNumeric(15)}`,
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createRating(overrides?: Partial<any>) {
    return {
      _id: faker.database.mongodbObjectId(),
      rideId: faker.database.mongodbObjectId(),
      fromUserId: faker.database.mongodbObjectId(),
      toUserId: faker.database.mongodbObjectId(),
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createAuthToken(overrides?: Partial<any>) {
    return {
      accessToken: faker.string.alphaNumeric(100),
      refreshToken: faker.string.alphaNumeric(100),
      expiresIn: 900,
      ...overrides,
    };
  }
}

/**
 * Utilitaires pour les JWT
 */
export class JwtTestUtils {
  constructor(private jwtService: JwtService) {}

  createToken(payload: any, expiresIn: string = '15m'): string {
    return this.jwtService.sign(payload, { expiresIn });
  }

  createRefreshToken(userId: string, expiresIn: string = '7d'): string {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn },
    );
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }
}

/**
 * Utilitaires pour les assertions personnalisées
 */
export class TestAssertions {
  static expectValidObjectId(id: any) {
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f]{24}$/i);
  }

  static expectValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(email).toMatch(emailRegex);
  }

  static expectValidDate(date: any) {
    expect(date).toBeDefined();
    expect(date instanceof Date || typeof date === 'string').toBe(true);
  }

  static expectValidCoordinates(coords: number[]) {
    expect(Array.isArray(coords)).toBe(true);
    expect(coords).toHaveLength(2);
    expect(typeof coords[0]).toBe('number');
    expect(typeof coords[1]).toBe('number');
    expect(coords[0]).toBeGreaterThanOrEqual(-180);
    expect(coords[0]).toBeLessThanOrEqual(180);
    expect(coords[1]).toBeGreaterThanOrEqual(-90);
    expect(coords[1]).toBeLessThanOrEqual(90);
  }
}
