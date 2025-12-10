Migration Backend: Supabase vers NestJS + MongoDB
Ce document décrit l'architecture et les spécifications pour migrer le backend de l'application de covoiturage de Supabase vers NestJS avec MongoDB.

Architecture du Projet
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── auth-response.dto.ts
│   ├── passengers/
│   │   ├── passengers.controller.ts
│   │   ├── passengers.service.ts
│   │   ├── passengers.module.ts
│   │   ├── schemas/
│   │   │   └── passenger.schema.ts
│   │   └── dto/
│   │       ├── create-passenger.dto.ts
│   │       └── update-passenger.dto.ts
│   ├── drivers/
│   │   ├── drivers.controller.ts
│   │   ├── drivers.service.ts
│   │   ├── drivers.module.ts
│   │   ├── schemas/
│   │   │   └── driver.schema.ts
│   │   └── dto/
│   │       ├── create-driver.dto.ts
│   │       └── update-driver.dto.ts
│   ├── rides/
│   │   ├── rides.controller.ts
│   │   ├── rides.service.ts
│   │   ├── rides.module.ts
│   │   ├── schemas/
│   │   │   └── ride.schema.ts
│   │   └── dto/
│   │       ├── create-ride.dto.ts
│   │       ├── update-ride.dto.ts
│   │       └── find-drivers.dto.ts
│   ├── payments/
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── payments.module.ts
│   │   ├── schemas/
│   │   │   └── payment-method.schema.ts
│   │   └── dto/
│   │       ├── create-payment-method.dto.ts
│   │       └── update-payment-method.dto.ts
│   └── location/
│       ├── location.gateway.ts
│       ├── location.service.ts
│       └── location.module.ts
└── test/
Diagramme UML - Entités
┌─────────────────────────┐
│      Passenger          │
├─────────────────────────┤
│ _id: ObjectId           │
│ auth_id: String         │
│ email: String           │
│ first_name: String      │
│ last_name: String       │
│ phone: String           │
│ profile_image: String   │
│ rating: Number          │
│ total_rides: Number     │
│ created_at: Date        │
│ updated_at: Date        │
└─────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐
│      Ride               │
├─────────────────────────┤
│ _id: ObjectId           │
│ passenger_id: ObjectId  │
│ driver_id: ObjectId     │
│ status: Enum            │
│ pickup_latitude: Number │
│ pickup_longitude: Number│
│ pickup_address: String  │
│ dropoff_latitude: Number│
│ dropoff_longitude: Number│
│ dropoff_address: String │
│ vehicle_type: String    │
│ estimated_price: Number │
│ final_price: Number     │
│ distance: Number        │
│ duration: Number        │
│ payment_method_id: ObjectId│
│ tip_amount: Number      │
│ rating: Number          │
│ feedback: String        │
│ created_at: Date        │
│ updated_at: Date        │
│ accepted_at: Date       │
│ started_at: Date        │
│ completed_at: Date      │
└─────────────────────────┘
           │
           │ N:1
           ▼
┌─────────────────────────┐
│      Driver             │
├─────────────────────────┤
│ _id: ObjectId           │
│ auth_id: String         │
│ email: String           │
│ first_name: String      │
│ last_name: String       │
│ phone: String           │
│ profile_image: String   │
│ vehicle_type: String    │
│ vehicle_make: String    │
│ vehicle_model: String   │
│ vehicle_year: Number    │
│ vehicle_color: String   │
│ license_plate: String   │
│ rating: Number          │
│ total_rides: Number     │
│ is_available: Boolean   │
│ current_latitude: Number│
│ current_longitude: Number│
│ created_at: Date        │
│ updated_at: Date        │
└─────────────────────────┘

┌─────────────────────────┐
│   PaymentMethod         │
├─────────────────────────┤
│ _id: ObjectId           │
│ passenger_id: ObjectId  │
│ type: Enum              │
│ provider: String        │
│ last_four: String       │
│ is_default: Boolean     │
│ created_at: Date        │
│ updated_at: Date        │
└─────────────────────────┘
Schémas MongoDB (Mongoose)
Passenger Schema
{
  auth_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  first_name: String,
  last_name: String,
  phone: String,
  profile_image: String,
  rating: { type: Number, default: 0 },
  total_rides: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
Driver Schema
{
  auth_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  first_name: String,
  last_name: String,
  phone: String,
  profile_image: String,
  vehicle_type: String,
  vehicle_make: String,
  vehicle_model: String,
  vehicle_year: Number,
  vehicle_color: String,
  license_plate: String,
  rating: { type: Number, default: 0 },
  total_rides: { type: Number, default: 0 },
  is_available: { type: Boolean, default: true },
  current_latitude: Number,
  current_longitude: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
Ride Schema
{
  passenger_id: { type: Schema.Types.ObjectId, ref: 'Passenger', required: true },
  driver_id: { type: Schema.Types.ObjectId, ref: 'Driver' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickup_latitude: { type: Number, required: true },
  pickup_longitude: { type: Number, required: true },
  pickup_address: String,
  dropoff_latitude: { type: Number, required: true },
  dropoff_longitude: { type: Number, required: true },
  dropoff_address: String,
  vehicle_type: String,
  estimated_price: Number,
  final_price: Number,
  distance: Number,
  duration: Number,
  payment_method_id: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
  tip_amount: { type: Number, default: 0 },
  rating: Number,
  feedback: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  accepted_at: Date,
  started_at: Date,
  completed_at: Date
}
PaymentMethod Schema
{
  passenger_id: { type: Schema.Types.ObjectId, ref: 'Passenger', required: true },
  type: {
    type: String,
    enum: ['card', 'apple_pay', 'google_pay', 'cash'],
    required: true
  },
  provider: String,
  last_four: String,
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
API Endpoints et Spécifications
1. Authentication
POST /auth/register
Créer un nouveau compte utilisateur.

Request:

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+33612345678"
}
Response 201:

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
Response 400:

{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
POST /auth/login
Connexion utilisateur.

Request:

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
Response 200:

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
Response 401:

{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
2. Passengers
GET /passengers/me
Obtenir le profil du passager connecté.

Headers:

Authorization: Bearer {access_token}
Response 200:

{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+33612345678",
  "profile_image": "https://example.com/profile.jpg",
  "rating": 4.8,
  "total_rides": 25,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-03-20T14:25:00.000Z"
}
PATCH /passengers/me
Mettre à jour le profil du passager.

Headers:

Authorization: Bearer {access_token}
Request:

{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+33687654321",
  "profile_image": "https://example.com/new-profile.jpg"
}
Response 200:

{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+33687654321",
  "profile_image": "https://example.com/new-profile.jpg",
  "rating": 4.8,
  "total_rides": 25,
  "updated_at": "2024-03-21T09:15:00.000Z"
}
3. Rides
POST /rides
Créer une nouvelle demande de course.

Headers:

Authorization: Bearer {access_token}
Request:

{
  "pickup_latitude": 48.8566,
  "pickup_longitude": 2.3522,
  "pickup_address": "Place de la Concorde, Paris",
  "dropoff_latitude": 48.8738,
  "dropoff_longitude": 2.2950,
  "dropoff_address": "Arc de Triomphe, Paris",
  "vehicle_type": "standard",
  "payment_method_id": "507f1f77bcf86cd799439012"
}
Response 201:

{
  "id": "507f1f77bcf86cd799439013",
  "passenger_id": "507f1f77bcf86cd799439011",
  "status": "pending",
  "pickup_latitude": 48.8566,
  "pickup_longitude": 2.3522,
  "pickup_address": "Place de la Concorde, Paris",
  "dropoff_latitude": 48.8738,
  "dropoff_longitude": 2.2950,
  "dropoff_address": "Arc de Triomphe, Paris",
  "vehicle_type": "standard",
  "estimated_price": 12.50,
  "distance": 3.2,
  "payment_method_id": "507f1f77bcf86cd799439012",
  "created_at": "2024-03-21T10:00:00.000Z"
}
POST /rides/find-drivers
Trouver des chauffeurs disponibles autour d'une position.

Headers:

Authorization: Bearer {access_token}
Request:

{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "radius": 5000,
  "vehicle_type": "standard"
}
Response 200:

{
  "drivers": [
    {
      "id": "507f1f77bcf86cd799439020",
      "first_name": "Pierre",
      "last_name": "Martin",
      "rating": 4.9,
      "total_rides": 450,
      "vehicle_type": "standard",
      "vehicle_make": "Tesla",
      "vehicle_model": "Model 3",
      "vehicle_color": "Noir",
      "license_plate": "AB-123-CD",
      "current_latitude": 48.8556,
      "current_longitude": 2.3512,
      "distance": 150,
      "estimated_arrival": 3
    },
    {
      "id": "507f1f77bcf86cd799439021",
      "first_name": "Marie",
      "last_name": "Dubois",
      "rating": 4.7,
      "total_rides": 320,
      "vehicle_type": "standard",
      "vehicle_make": "Peugeot",
      "vehicle_model": "508",
      "vehicle_color": "Blanc",
      "license_plate": "EF-456-GH",
      "current_latitude": 48.8576,
      "current_longitude": 2.3532,
      "distance": 280,
      "estimated_arrival": 5
    }
  ]
}
GET /rides/:id
Obtenir les détails d'une course.

Headers:

Authorization: Bearer {access_token}
Response 200:

{
  "id": "507f1f77bcf86cd799439013",
  "passenger": {
    "id": "507f1f77bcf86cd799439011",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+33612345678",
    "rating": 4.8
  },
  "driver": {
    "id": "507f1f77bcf86cd799439020",
    "first_name": "Pierre",
    "last_name": "Martin",
    "phone": "+33698765432",
    "rating": 4.9,
    "vehicle_make": "Tesla",
    "vehicle_model": "Model 3",
    "vehicle_color": "Noir",
    "license_plate": "AB-123-CD"
  },
  "status": "in_progress",
  "pickup_latitude": 48.8566,
  "pickup_longitude": 2.3522,
  "pickup_address": "Place de la Concorde, Paris",
  "dropoff_latitude": 48.8738,
  "dropoff_longitude": 2.2950,
  "dropoff_address": "Arc de Triomphe, Paris",
  "vehicle_type": "standard",
  "estimated_price": 12.50,
  "distance": 3.2,
  "created_at": "2024-03-21T10:00:00.000Z",
  "accepted_at": "2024-03-21T10:02:00.000Z",
  "started_at": "2024-03-21T10:08:00.000Z"
}
PATCH /rides/:id
Mettre à jour une course (statut, prix final, pourboire).

Headers:

Authorization: Bearer {access_token}
Request:

{
  "status": "completed",
  "final_price": 13.20,
  "tip_amount": 2.00
}
Response 200:

{
  "id": "507f1f77bcf86cd799439013",
  "status": "completed",
  "final_price": 13.20,
  "tip_amount": 2.00,
  "completed_at": "2024-03-21T10:25:00.000Z"
}
POST /rides/:id/rate
Noter une course terminée.

Headers:

Authorization: Bearer {access_token}
Request:

{
  "rating": 5,
  "feedback": "Excellent service, chauffeur très sympathique!"
}
Response 200:

{
  "id": "507f1f77bcf86cd799439013",
  "rating": 5,
  "feedback": "Excellent service, chauffeur très sympathique!",
  "updated_at": "2024-03-21T10:30:00.000Z"
}
GET /rides
Obtenir l'historique des courses du passager.

Headers:

Authorization: Bearer {access_token}
Query Parameters:

page (optional): Numéro de page (défaut: 1)
limit (optional): Nombre de résultats par page (défaut: 20)
status (optional): Filtrer par statut
Response 200:

{
  "rides": [
    {
      "id": "507f1f77bcf86cd799439013",
      "driver": {
        "first_name": "Pierre",
        "last_name": "Martin",
        "rating": 4.9
      },
      "status": "completed",
      "pickup_address": "Place de la Concorde, Paris",
      "dropoff_address": "Arc de Triomphe, Paris",
      "final_price": 13.20,
      "rating": 5,
      "created_at": "2024-03-21T10:00:00.000Z",
      "completed_at": "2024-03-21T10:25:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "pages": 2
}
4. Payment Methods
POST /payments/methods
Ajouter un nouveau moyen de paiement.

Headers:

Authorization: Bearer {access_token}
Request:

{
  "type": "card",
  "provider": "Visa",
  "last_four": "4242",
  "is_default": true
}
Response 201:

{
  "id": "507f1f77bcf86cd799439012",
  "passenger_id": "507f1f77bcf86cd799439011",
  "type": "card",
  "provider": "Visa",
  "last_four": "4242",
  "is_default": true,
  "created_at": "2024-03-21T09:00:00.000Z"
}
GET /payments/methods
Obtenir tous les moyens de paiement du passager.

Headers:

Authorization: Bearer {access_token}
Response 200:

{
  "payment_methods": [
    {
      "id": "507f1f77bcf86cd799439012",
      "type": "card",
      "provider": "Visa",
      "last_four": "4242",
      "is_default": true,
      "created_at": "2024-03-21T09:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "type": "card",
      "provider": "Mastercard",
      "last_four": "8888",
      "is_default": false,
      "created_at": "2024-03-15T14:30:00.000Z"
    }
  ]
}
GET /payments/methods/default
Obtenir le moyen de paiement par défaut.

Headers:

Authorization: Bearer {access_token}
Response 200:

{
  "id": "507f1f77bcf86cd799439012",
  "type": "card",
  "provider": "Visa",
  "last_four": "4242",
  "is_default": true
}
Response 404:

{
  "statusCode": 404,
  "message": "No default payment method found",
  "error": "Not Found"
}
PATCH /payments/methods/:id
Mettre à jour un moyen de paiement.

Headers:

Authorization: Bearer {access_token}
Request:

{
  "is_default": true
}
Response 200:

{
  "id": "507f1f77bcf86cd799439014",
  "type": "card",
  "provider": "Mastercard",
  "last_four": "8888",
  "is_default": true,
  "updated_at": "2024-03-21T11:00:00.000Z"
}
DELETE /payments/methods/:id
Supprimer un moyen de paiement.

Headers:

Authorization: Bearer {access_token}
Response 204:

No Content
Response 400:

{
  "statusCode": 400,
  "message": "Cannot delete default payment method",
  "error": "Bad Request"
}
5. Location Tracking (WebSocket)
WebSocket Connection
Connexion pour le suivi de position en temps réel.

Endpoint: ws://localhost:3000/location

Authentication:

?token={access_token}
Events:

Client → Server
join-ride:

{
  "event": "join-ride",
  "data": {
    "ride_id": "507f1f77bcf86cd799439013"
  }
}
update-location (driver only):

{
  "event": "update-location",
  "data": {
    "ride_id": "507f1f77bcf86cd799439013",
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
Server → Client
driver-location:

{
  "event": "driver-location",
  "data": {
    "ride_id": "507f1f77bcf86cd799439013",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "timestamp": "2024-03-21T10:15:00.000Z"
  }
}
ride-status-changed:

{
  "event": "ride-status-changed",
  "data": {
    "ride_id": "507f1f77bcf86cd799439013",
    "status": "in_progress",
    "timestamp": "2024-03-21T10:08:00.000Z"
  }
}
Installation et Configuration
1. Installer NestJS CLI
npm install -g @nestjs/cli
2. Créer le projet
nest new backend
cd backend
3. Installer les dépendances
npm install @nestjs/mongoose mongoose
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install bcrypt
npm install class-validator class-transformer
npm install @nestjs/config

npm install -D @types/passport-jwt @types/bcrypt
4. Configuration MongoDB
Créer .env:

MONGODB_URI=mongodb://localhost:27017/rideshare
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3000
5. Commandes de génération
# Générer les modules
nest g module auth
nest g module passengers
nest g module drivers
nest g module rides
nest g module payments
nest g module location

# Générer les contrôleurs
nest g controller auth
nest g controller passengers
nest g controller drivers
nest g controller rides
nest g controller payments

# Générer les services
nest g service auth
nest g service passengers
nest g service drivers
nest g service rides
nest g service payments
nest g service location

# Générer le gateway WebSocket
nest g gateway location
6. Démarrer le serveur
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
Migration des données
Script de migration Supabase → MongoDB à créer dans scripts/migrate.ts:

// Connecter à Supabase
// Récupérer toutes les données des tables
// Transformer au format MongoDB
// Insérer dans MongoDB
Tests
Tests unitaires
npm run test
Tests e2e
npm run test:e2e
Coverage
npm run test:cov
Sécurité
Authentication JWT: Toutes les routes protégées nécessitent un token JWT valide
Validation: Utiliser class-validator pour valider toutes les entrées
Hash passwords: Utiliser bcrypt avec un salt de 10
CORS: Configurer correctement pour l'application mobile
Rate limiting: Implémenter pour éviter les abus
Helmet: Ajouter pour sécuriser les headers HTTP
Déploiement
Options de déploiement:
Heroku (facile, gratuit pour commencer)
DigitalOcean (droplet + MongoDB Atlas)
AWS (EC2 + MongoDB Atlas)
Railway (simple, moderne)
MongoDB Cloud:
Utiliser MongoDB Atlas pour la base de données en production.

Documentation API
Ajouter Swagger pour la documentation automatique:

npm install @nestjs/swagger swagger-ui-express
Accès: http://localhost:3000/api