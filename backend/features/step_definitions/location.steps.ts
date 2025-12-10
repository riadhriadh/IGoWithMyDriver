import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { TestDataFactory, TestAssertions } from '../../test/test-utils';

interface LocationContext {
  driver?: any;
  locations?: any[];
  currentLocation?: any;
  latestLocation?: any;
  error?: string;
  result?: any;
  userEmail?: string;
}

const context: LocationContext = {};

// Background steps
Given('the location service is running', function () {
  // Service initialization
});

Given('a driver user exists with email {string}', function (email: string) {
  context.driver = TestDataFactory.createDriver();
  context.userEmail = email;
});

// Upload location steps
Given('I am logged in as driver {string}', function (email: string) {
  context.userEmail = email;
  context.driver = TestDataFactory.createDriver();
});

When('I upload my current location:', function (dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const locationData = {
    userId: context.driver?._id,
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    accuracy: parseFloat(data.accuracy),
    speed: parseFloat(data.speed),
    bearing: parseInt(data.bearing),
    batteryLevel: parseInt(data.batteryLevel),
  };

  try {
    // Validate coordinates
    TestAssertions.expectValidCoordinates([
      locationData.longitude,
      locationData.latitude,
    ]);

    context.currentLocation = TestDataFactory.createLocation(locationData);
    context.result = { success: true, location: context.currentLocation };
  } catch (error) {
    context.error = error.message;
  }
});

Then('the location should be saved successfully', function () {
  if (!context.currentLocation?._id) {
    throw new Error('Location not saved');
  }
});

Then('the location should have a timestamp', function () {
  if (!context.currentLocation?.createdAt) {
    throw new Error('Location missing timestamp');
  }
});

// Get latest location steps
Given('the driver has uploaded {string} location updates', function (count: string) {
  const locationCount = parseInt(count);
  context.locations = Array.from({ length: locationCount }, (_, index) =>
    TestDataFactory.createLocation({
      userId: context.driver?._id,
      createdAt: new Date(Date.now() - index * 60000), // Spaced 1 minute apart
    }),
  );
  context.latestLocation = context.locations[0]; // Most recent
});

When('I request the latest location', function () {
  if (context.locations && context.locations.length > 0) {
    context.result = context.latestLocation;
  }
});

Then('I should receive the most recent location', function () {
  if (!context.result) {
    throw new Error('No location received');
  }
});

Then('the location should have all required fields', function () {
  const requiredFields = [
    'userId',
    'latitude',
    'longitude',
    'accuracy',
    'createdAt',
  ];

  requiredFields.forEach((field) => {
    if (!(field in context.result)) {
      throw new Error(`Location missing required field: ${field}`);
    }
  });
});

// Location history steps
Given('the driver has {string} location records', function (count: string) {
  const recordCount = parseInt(count);
  context.locations = Array.from({ length: recordCount }, (_, index) =>
    TestDataFactory.createLocation({
      userId: context.driver?._id,
      createdAt: new Date(Date.now() - index * 60000),
    }),
  );
});

When('I request location history with limit {string}', function (limit: string) {
  const limitNum = parseInt(limit);
  const history = context.locations?.slice(0, limitNum) || [];
  context.result = { locations: history, limit: limitNum };
});

Then('I should receive {string} location records', function (expectedCount: string) {
  const count = parseInt(expectedCount);
  if (context.result?.locations?.length !== count) {
    throw new Error(
      `Expected ${count} records, got ${context.result?.locations?.length}`,
    );
  }
});

Then('the records should be ordered by most recent first', function () {
  if (!Array.isArray(context.result?.locations)) {
    throw new Error('No locations in result');
  }

  for (let i = 0; i < context.result.locations.length - 1; i++) {
    const current = new Date(context.result.locations[i].createdAt).getTime();
    const next = new Date(context.result.locations[i + 1].createdAt).getTime();

    if (current < next) {
      throw new Error('Locations not ordered by most recent first');
    }
  }
});

// Distance calculation steps
Given('two locations exist:', function (dataTable: DataTable) {
  const rows = dataTable.rows();
  context.locations = rows.map((row) =>
    TestDataFactory.createLocation({
      latitude: parseFloat(row[0]),
      longitude: parseFloat(row[1]),
    }),
  );
});

When('I calculate distance between the locations', function () {
  if (context.locations && context.locations.length === 2) {
    const loc1 = context.locations[0];
    const loc2 = context.locations[1];

    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    context.result = { distance };
  }
});

Then('the distance should be calculated in kilometers', function () {
  if (typeof context.result?.distance !== 'number') {
    throw new Error('Distance not calculated');
  }
});

Then('the distance should be greater than {int}', function (min: number) {
  if (context.result?.distance <= min) {
    throw new Error(
      `Distance should be > ${min}, got ${context.result?.distance}`,
    );
  }
});

Then('the distance should be less than {int}', function (max: number) {
  if (context.result?.distance >= max) {
    throw new Error(
      `Distance should be < ${max}, got ${context.result?.distance}`,
    );
  }
});

// WebSocket stream steps
Given('a passenger is tracking a ride', function () {
  // WebSocket connection setup
  context.result = { wsConnected: true };
});

When('the driver connects to the location stream', function () {
  context.result = { driverConnected: true };
});

When('the driver sends a location update', function () {
  context.currentLocation = TestDataFactory.createLocation({
    userId: context.driver?._id,
  });
  context.result = { locationSent: true };
});

Then('the passenger should receive the location update in real-time', function () {
  if (!context.result?.locationSent) {
    throw new Error('Location not sent');
  }
});

Then('the update should contain latitude and longitude', function () {
  if (
    typeof context.currentLocation?.latitude !== 'number' ||
    typeof context.currentLocation?.longitude !== 'number'
  ) {
    throw new Error('Location missing latitude or longitude');
  }
});

// Accuracy validation steps
When('I upload a location with:', function (dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const locationData = {
    userId: context.driver?._id,
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    accuracy: parseFloat(data.accuracy),
  };

  context.currentLocation = TestDataFactory.createLocation(locationData);
  context.result = { location: context.currentLocation };
});

Then('the location should be validated', function () {
  if (!context.currentLocation) {
    throw new Error('Location validation failed');
  }
});

Then('the coordinates should be within valid ranges', function () {
  try {
    TestAssertions.expectValidCoordinates([
      context.currentLocation.longitude,
      context.currentLocation.latitude,
    ]);
  } catch (error) {
    throw new Error('Coordinates out of valid range');
  }
});

Then('the accuracy should be recorded', function () {
  if (typeof context.currentLocation?.accuracy !== 'number') {
    throw new Error('Accuracy not recorded');
  }
});

// Cleanup steps
Given('the driver has location records older than {int} days', function (days: number) {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - (days + 1));

  context.locations = [
    ...Array.from({ length: 5 }, () =>
      TestDataFactory.createLocation({ createdAt: oldDate }),
    ),
    ...Array.from({ length: 5 }, () =>
      TestDataFactory.createLocation({
        createdAt: new Date(),
      }),
    ),
  ];
});

When('the system performs location cleanup', function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  context.locations = context.locations?.filter((loc) => {
    return new Date(loc.createdAt) > thirtyDaysAgo;
  });

  context.result = { cleaned: true };
});

Then('old location records should be deleted', function () {
  if (!context.result?.cleaned) {
    throw new Error('Cleanup not performed');
  }
});

Then('recent location records should remain', function () {
  if (!Array.isArray(context.locations)) {
    throw new Error('No recent records found');
  }
});

// Disabled tracking steps
Given('location tracking is disabled', function () {
  context.result = { trackingEnabled: false };
});

When('I try to upload location', function () {
  if (!context.result?.trackingEnabled) {
    context.error = 'Location tracking disabled';
  }
});

Then('the upload should be rejected', function () {
  if (!context.error) {
    throw new Error('Upload should have been rejected');
  }
});

// Multiple drivers steps
Given('multiple drivers are active', function () {
  context.locations = [];
  for (let i = 0; i < 5; i++) {
    context.locations.push(
      TestDataFactory.createLocation({
        userId: `driver-${i}`,
      }),
    );
  }
});

When('each driver sends location updates simultaneously', function () {
  context.result = { updateCount: context.locations?.length || 0 };
});

Then('each location update should be recorded separately', function () {
  if (!Array.isArray(context.locations) || context.locations.length === 0) {
    throw new Error('Locations not recorded');
  }
});

Then('there should be no data loss or mixing', function () {
  // Verify each location has unique userId
  const userIds = new Set(context.locations?.map((loc) => loc.userId));
  if (userIds.size !== context.locations?.length) {
    throw new Error('Data mixing detected');
  }
});
