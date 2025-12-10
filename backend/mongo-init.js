// MongoDB initialization script
db.createUser({
  user: 'taxi_user',
  pwd: 'taxi_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'taxi-vtc'
    }
  ]
});

// Create collections
db.createCollection('drivers');
db.createCollection('passengers');
db.createCollection('rides');
db.createCollection('vehicles');
db.createCollection('payments');
db.createCollection('ratings');
db.createCollection('locations');
db.createCollection('incidents');
db.createCollection('documents');

// Create indexes
db.drivers.createIndex({ email: 1 }, { unique: true });
db.drivers.createIndex({ phone: 1 }, { unique: true });
db.drivers.createIndex({ location: '2dsphere' });

db.passengers.createIndex({ email: 1 }, { unique: true });
db.passengers.createIndex({ phone: 1 }, { unique: true });

db.rides.createIndex({ driverId: 1, createdAt: -1 });
db.rides.createIndex({ passengerId: 1, createdAt: -1 });
db.rides.createIndex({ status: 1, createdAt: -1 });

db.locations.createIndex({ driverId: 1, createdAt: -1 });
db.locations.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

db.ratings.createIndex({ driverId: 1 });
db.ratings.createIndex({ passengerId: 1 });
db.ratings.createIndex({ rideId: 1 });
