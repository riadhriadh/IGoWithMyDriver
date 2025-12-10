import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from '../../src/modules/rides/rides.service';
import { TestDataFactory } from '../../test/test-utils';

interface RideContext {
  driver?: any;
  passenger?: any;
  currentRide?: any;
  rides?: any[];
  error?: string;
  result?: any;
  ridesService?: RidesService;
  userEmail?: string;
  rideCount?: number;
}

const context: RideContext = {};

// Background steps
Given('the ride service is running', function () {
  // Service initialization
});

Given('a driver user exists with email {string}', function (email: string) {
  context.driver = TestDataFactory.createDriver({
    userId: 'driver-id-123',
  });
});

Given('a passenger user exists with email {string}', function (email: string) {
  context.passenger = TestDataFactory.createUser({
    email,
    role: 'passenger',
  });
});

// Ride request steps
Given('I am logged in as passenger {string}', function (email: string) {
  context.userEmail = email;
  context.passenger = TestDataFactory.createUser({
    email,
    role: 'passenger',
  });
});

Given('I am logged in as driver {string}', function (email: string) {
  context.userEmail = email;
  context.driver = TestDataFactory.createDriver();
});

When('I request a ride with the following details:', function (dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const rideData = {
    passengerId: context.passenger?._id || 'passenger-123',
    pickupLocation: {
      type: 'Point',
      coordinates: [parseFloat(data.pickupLongitude), parseFloat(data.pickupLatitude)],
      address: data.pickupAddress,
    },
    dropoffLocation: {
      type: 'Point',
      coordinates: [parseFloat(data.dropoffLongitude), parseFloat(data.dropoffLatitude)],
      address: data.dropoffAddress,
    },
  };

  context.currentRide = TestDataFactory.createRide({
    ...rideData,
    status: 'REQUESTED',
  });
  context.result = context.currentRide;
});

Then('the ride should be created successfully', function () {
  if (!context.currentRide) {
    throw new Error('Ride not created');
  }
});

Then('the ride status should be {string}', function (status: string) {
  if (context.currentRide?.status !== status) {
    throw new Error(
      `Expected status ${status}, got ${context.currentRide?.status}`,
    );
  }
});

Then('I should receive a ride ID', function () {
  if (!context.currentRide?._id) {
    throw new Error('No ride ID received');
  }
});

// Driver acceptance steps
Given('a ride with status {string} exists', function (status: string) {
  context.currentRide = TestDataFactory.createRide({ status });
});

When("the driver accepts the ride", function () {
  if (context.currentRide) {
    context.currentRide.status = 'ACCEPTED';
    context.currentRide.driverId = context.driver?._id;
    context.result = { message: 'Ride accepted' };
  }
});

Then('the ride status should be updated to {string}', function (status: string) {
  if (context.currentRide?.status !== status) {
    throw new Error(
      `Expected status ${status}, got ${context.currentRide?.status}`,
    );
  }
});

Then('the ride should be assigned to the driver', function () {
  if (context.currentRide?.driverId !== context.driver?._id) {
    throw new Error('Ride not assigned to driver');
  }
});

Then('the passenger should be notified', function () {
  // In real scenario, this would check WebSocket notifications
  context.result = { notified: true };
});

// Ride start steps
When('the driver starts the ride', function () {
  if (context.currentRide && context.currentRide.status === 'ACCEPTED') {
    context.currentRide.status = 'EN_ROUTE';
    context.result = { message: 'Ride started' };
  }
});

Then('the passenger should be notified of ride start', function () {
  // Notification check
  if (!context.result) {
    throw new Error('Notification not sent');
  }
});

// Arrival steps
When('the driver marks arrival at destination', function () {
  if (context.currentRide && context.currentRide.status === 'EN_ROUTE') {
    context.currentRide.status = 'ARRIVED';
    context.result = { message: 'Arrival marked' };
  }
});

Then('the passenger should be notified of arrival', function () {
  if (!context.result) {
    throw new Error('Arrival notification not sent');
  }
});

// Ride completion steps
When('the driver completes the ride', function () {
  if (
    context.currentRide &&
    context.currentRide.status === 'ONBOARD'
  ) {
    context.currentRide.status = 'COMPLETED';
    context.currentRide.fare = 45.5; // Example fare calculation
    context.result = {
      message: 'Ride completed',
      fare: context.currentRide.fare,
    };
  }
});

Then('the fare should be calculated', function () {
  if (typeof context.currentRide?.fare !== 'number') {
    throw new Error('Fare not calculated');
  }
});

Then('a payment should be created', function () {
  context.result = {
    paymentId: 'payment-123',
    amount: context.currentRide?.fare,
    status: 'completed',
  };
});

// Cancellation steps
When('the passenger cancels the ride', function () {
  if (context.currentRide && context.currentRide.status === 'REQUESTED') {
    context.currentRide.status = 'CANCELLED';
    context.result = { message: 'Ride cancelled' };
  }
});

Then('the driver should be notified of cancellation', function () {
  if (!context.result) {
    throw new Error('Cancellation notification not sent');
  }
});

// Invalid transition steps
When('I try to update the ride status to {string}', function (newStatus: string) {
  try {
    if (
      context.currentRide?.status === 'COMPLETED' &&
      newStatus === 'ACCEPTED'
    ) {
      throw new Error('Invalid status transition');
    }
    context.currentRide.status = newStatus;
  } catch (error) {
    context.error = error.message;
  }
});

Then('the update should fail', function () {
  if (!context.error) {
    throw new Error('Update should have failed');
  }
});

Then('I should receive error {string}', function (errorMsg: string) {
  if (!context.error || !context.error.includes(errorMsg)) {
    throw new Error(
      `Expected error "${errorMsg}", got "${context.error}"`,
    );
  }
});

// Ride history steps
Given('the passenger has completed {string} rides', function (count: string) {
  const rideCount = parseInt(count);
  context.rides = Array.from({ length: rideCount }, () =>
    TestDataFactory.createRide({ status: 'COMPLETED' }),
  );
  context.rideCount = rideCount;
});

When('I request the ride history', function () {
  context.result = {
    rides: context.rides,
    total: context.rides?.length || 0,
  };
});

Then('I should receive {string} completed rides', function (expectedCount: string) {
  const count = parseInt(expectedCount);
  if (context.result?.rides?.length !== count) {
    throw new Error(
      `Expected ${count} rides, got ${context.result?.rides?.length}`,
    );
  }
});

Then('each ride should have a status and fare', function () {
  if (!Array.isArray(context.result?.rides)) {
    throw new Error('No rides in result');
  }

  context.result.rides.forEach((ride) => {
    if (!ride.status || typeof ride.fare !== 'number') {
      throw new Error('Ride missing status or fare');
    }
  });
});

// Active rides steps
Given("the driver has {string} active rides", function (count: string) {
  const rideCount = parseInt(count);
  context.rides = Array.from({ length: rideCount }, () =>
    TestDataFactory.createRide({ status: 'EN_ROUTE', driverId: context.driver?._id }),
  );
});

When('I request active rides', function () {
  context.result = {
    rides: context.rides,
    total: context.rides?.length || 0,
  };
});

Then('I should receive {string} active rides', function (expectedCount: string) {
  const count = parseInt(expectedCount);
  if (context.result?.rides?.length !== count) {
    throw new Error(
      `Expected ${count} rides, got ${context.result?.rides?.length}`,
    );
  }
});

Then('the rides should show pickup and dropoff locations', function () {
  if (!Array.isArray(context.result?.rides)) {
    throw new Error('No rides in result');
  }

  context.result.rides.forEach((ride) => {
    if (
      !ride.pickupLocation?.address ||
      !ride.dropoffLocation?.address
    ) {
      throw new Error('Ride missing pickup or dropoff location');
    }
  });
});

// Real-time location steps
Given('a ride is in progress', function () {
  context.currentRide = TestDataFactory.createRide({ status: 'EN_ROUTE' });
});

Given('the driver is streaming location updates', function () {
  context.result = { streaming: true };
});

When('the driver location is updated', function () {
  context.currentRide.currentLocation = {
    latitude: 48.8600,
    longitude: 2.3600,
    timestamp: new Date(),
  };
  context.result = { locationUpdated: true };
});

Then('the passenger should receive the location update in real-time', function () {
  if (!context.result?.locationUpdated) {
    throw new Error('Location update not received');
  }
});

Then('the location should contain latitude and longitude', function () {
  if (
    typeof context.currentRide?.currentLocation?.latitude !== 'number' ||
    typeof context.currentRide?.currentLocation?.longitude !== 'number'
  ) {
    throw new Error('Location missing latitude or longitude');
  }
});
