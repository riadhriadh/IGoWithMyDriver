# Backend Taxi VTC - Architecture Microservices NestJS + MongoDB + Redis

## 🎯 Vue d'ensemble

Architecture complète d'un backend microservices pour une application de taxi VTC supportant :
- **App Driver** (React Native) - Chauffeurs
- **App Passenger** (React Native) - Passagers
- **App Admin** (Web) - Gestion administrative

## 📊 Architecture Système

```
┌─────────────────────┐         ┌──────────────────────┐        ┌─────────────────┐
│   Driver App        │         │  Passenger App       │        │   Admin Web     │
│  (React Native)     │         │  (React Native)      │        │   Dashboard     │
└──────────┬──────────┘         └──────────┬───────────┘        └────────┬────────┘
           │                               │                             │
           │        HTTP/REST + WebSocket  │                             │
           └───────────────────┬───────────┴─────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Gateway       │
                    │   NestJS (3000)     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼────┐  ┌─────▼─────┐  ┌────▼─────┐
         │  MongoDB   │  │   Redis   │  │  WebSocket│
         │  (27017)   │  │  (6379)   │  │  Channels │
         └────────────┘  └───────────┘  └───────────┘
```

## 🏗️ Architecture des Modules

### 1. **Auth Module** 🔐
Gestion complète de l'authentification et autorisation.

**Endpoints:**
- `POST /api/v1/auth/register` - Inscription (driver/passenger)
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Renouvellement du token
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/auth/me` - Profil actuel

**Features:**
- JWT tokens (access + refresh)
- Hash bcryptjs des mots de passe
- Strategies: JWT + Local
- Guards: JwtAuthGuard, RolesGuard

### 2. **Users Module** 👤
Gestion des profils utilisateurs.

**Endpoints:**
- `GET /api/v1/users/me` - Profil courant
- `PATCH /api/v1/users/me` - Mettre à jour le profil
- `DELETE /api/v1/users/me` - Supprimer le compte
- `GET /api/v1/users` - Liste des utilisateurs (admin)
- `GET /api/v1/users/:id` - Détails utilisateur

**Types d'utilisateurs:**
- `driver` - Chauffeur
- `passenger` - Passager
- `admin` - Administrateur

### 3. **Drivers Module** 🚗
Gestion spécifique des chauffeurs.

**Endpoints:**
- `GET /api/v1/drivers/profile` - Profil du chauffeur
- `PATCH /api/v1/drivers/profile` - Mettre à jour le profil
- `GET /api/v1/drivers/nearby` - Trouver les chauffeurs proches
- `PATCH /api/v1/drivers/:id/location` - Mettre à jour la localisation
- `PATCH /api/v1/drivers/:id/status` - Mettre à jour le statut
- `GET /api/v1/drivers` - Liste des chauffeurs

**Schema Fields:**
- userId (ref User)
- status: available | busy | offline
- location (latitude, longitude, updatedAt)
- rating (0-5)
- totalRides
- isVerified, isApproved
- licenseNumber, licenseExpiry
- documentUrls[]
- bankDetails

### 4. **Passengers Module** 👥
Gestion spécifique des passagers.

**Endpoints:**
- `GET /api/v1/passengers/profile` - Profil du passager
- `PATCH /api/v1/passengers/profile` - Mettre à jour le profil
- `GET /api/v1/passengers` - Liste des passagers

**Schema Fields:**
- userId (ref User)
- rating (0-5)
- totalRides
- favoriteLocations[]
- paymentMethods[] (refs Payment)

### 5. **Rides Module** 🚕
Gestion des courses avec logique complexe.

**Endpoints:**
- `POST /api/v1/rides` - Créer une nouvelle course
- `GET /api/v1/rides/:id` - Détails d'une course
- `GET /api/v1/rides` - Courses de l'utilisateur
- `PATCH /api/v1/rides/:id` - Mettre à jour les détails
- `PATCH /api/v1/rides/:id/status` - Mettre à jour le statut
- `DELETE /api/v1/rides/:id` - Annuler une course

**Statuts de Course:**
```
REQUESTED 
  ├─→ ACCEPTED 
  │   ├─→ EN_ROUTE_TO_PICKUP 
  │   │   ├─→ ARRIVED_AT_PICKUP 
  │   │   │   ├─→ PASSENGER_ONBOARD 
  │   │   │   │   ├─→ ARRIVED_AT_DESTINATION 
  │   │   │   │   │   └─→ COMPLETED ✅
  │   │   │   │   └─→ CANCELLED ❌
  │   │   │   └─→ NO_SHOW ❌
  │   │   └─→ CANCELLED ❌
  │   └─→ CANCELLED ❌
  └─→ CANCELLED ❌
```

**Schema Fields:**
- passengerId, driverId (refs)
- pickupAddress, pickupLatitude, pickupLongitude
- destinationAddress, destinationLatitude, destinationLongitude
- estimatedFare, actualFare
- status (enum)
- rideType (economy, comfort, premium)
- timestamps: acceptedAt, arrivedAtPickupAt, startedAt, completedAt
- route (distance, duration)
- rating, feedback

**WebSocket Events:**
- `join-ride` - Rejoindre une course
- `ride-update` - Mise à jour de course
- `driver-location` - Position du chauffeur

### 6. **Location Module** 📍
Tracking GPS en temps réel.

**Features:**
- Tracking continu de la position du chauffeur
- Historique avec TTL de 30 jours
- WebSocket pour les mises à jour en temps réel
- Broadcast aux clients connectés

**Schema Fields:**
- driverId, rideId (refs)
- latitude, longitude
- accuracy, altitude, speed, heading
- isOnline, batteryLevel
- timestamp (avec TTL)

**WebSocket Namespace:** `/location`
- `register-driver` - Enregistrer un chauffeur
- `location-update` - Envoyer une mise à jour
- `location-updated` - Événement reçu

### 7. **Payments Module** 💳
Gestion des paiements.

**Endpoints:**
- `GET /api/v1/payments` - Historique des paiements
- `GET /api/v1/payments/:id` - Détails d'un paiement

**Schema Fields:**
- userId, rideId (refs)
- amount
- method: card | wallet | cash
- status: pending | completed | failed | refunded
- transactionId
- gatewayResponse
- refundAmount, refundReason

### 8. **Ratings Module** ⭐
Système de notation et avis.

**Endpoints:**
- `POST /api/v1/ratings` - Créer une notation
- `GET /api/v1/ratings/driver/:driverId/average` - Note moyenne
- `GET /api/v1/ratings/ride/:rideId` - Notes pour une course

**Schema Fields:**
- rideId, driverId, passengerId (refs)
- rating (1-5)
- comment
- ratedBy (driver | passenger)

### 9. **Admin Module** 🔑
Tableau de bord administratif.

**Endpoints:**
- `GET /api/v1/admin/dashboard` - Statistiques globales
- `GET /api/v1/admin/users` - Gestion des utilisateurs
- `GET /api/v1/admin/drivers` - Gestion des chauffeurs
- `GET /api/v1/admin/passengers` - Gestion des passagers

**Features:**
- Accès réservé aux rôles 'admin'
- Statistiques en temps réel
- Gestion complète des utilisateurs

### 10. **Health Module** 💚
Vérification de la santé de l'application.

**Endpoints:**
- `GET /api/v1/health` - État de l'application

## 🗄️ Schémas MongoDB

### Collections Principales

```mongodb
db.users
  - _id (ObjectId)
  - email (unique)
  - firstName, lastName
  - phone (unique)
  - password (hashed)
  - userType (driver | passenger | admin)
  - avatarUrl
  - isEmailVerified, isPhoneVerified
  - isActive
  - refreshToken
  - lastLoginAt
  - metadata
  - createdAt, updatedAt
  - Indexes: email, phone, userType, isActive, createdAt

db.drivers
  - userId (ref User, unique)
  - status (available | busy | offline)
  - location {latitude, longitude, updatedAt}
  - rating, totalRides
  - isVerified, isApproved
  - licenseNumber, licenseExpiry
  - documentUrls
  - bankDetails
  - biometricData
  - Indexes: userId, status, isOnline, location (2dsphere), rating, createdAt

db.passengers
  - userId (ref User, unique)
  - rating, totalRides
  - favoriteLocations
  - paymentMethods (refs Payment)
  - Indexes: userId, rating, createdAt

db.rides
  - passengerId (ref Passenger)
  - driverId (ref Driver)
  - pickup/destination addresses + coords
  - estimatedFare, actualFare
  - status (enum)
  - rideType
  - timestamps
  - route, rating, feedback
  - Indexes: passengerId, driverId, status, coords

db.locations
  - driverId (ref Driver)
  - latitude, longitude, accuracy, altitude, speed, heading
  - rideId (ref Ride)
  - isOnline, batteryLevel
  - timestamp (TTL: 30 jours)
  - Indexes: driverId+timestamp, timestamp, driverId+rideId, 2dsphere

db.payments
  - userId (ref User)
  - rideId (ref Ride)
  - amount, method, status
  - transactionId, gatewayResponse
  - refundAmount, refundReason
  - Indexes: userId, rideId, status, createdAt

db.ratings
  - rideId (ref Ride)
  - driverId, passengerId (refs)
  - rating (1-5), comment
  - ratedBy (driver | passenger)
  - Indexes: rideId, driverId, passengerId, createdAt
```

## 🔐 Sécurité

### Authentification
- **JWT** avec access token (15m) + refresh token (7j)
- **Bcryptjs** pour le hash des mots de passe (salt: 10)
- **Passport.js** avec stratégies JWT et Local
- **CORS** configurable par env

### Autorisation
- **Guards**: JwtAuthGuard, RolesGuard
- **Decorators**: @Roles('admin'), @GetUser()
- **Validation**: class-validator pour les DTOs

### Validation des Données
- **Pipes**: ValidationPipe (whitelist, forbidNonWhitelisted, transform)
- **Class-validator** pour les règles de validation
- **Class-transformer** pour la transformation des DTOs

## 🚀 Démarrage

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- npm ou yarn

### Installation Locale

```bash
# 1. Installer les dépendances
npm install

# 2. Copier l'environnement
cp .env.example .env

# 3. Configurer les variables d'environnement
# Éditer .env avec vos paramètres

# 4. Démarrer MongoDB et Redis (Docker)
docker-compose up -d mongo redis

# 5. Démarrer l'application
npm run start:dev
```

### Démarrage avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Afficher les logs
docker-compose logs -f api

# Arrêter
docker-compose down
```

## 📚 Documentation API

Une fois l'application démarrée:

**Swagger UI**: http://localhost:3000/api/v1/docs

Tous les endpoints sont documentés avec:
- Descriptions détaillées
- Paramètres et réponses
- Schémas de requête/réponse
- Authentification Bearer

## 🧪 Testing

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:cov

# Tests e2e
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📦 Structure des Fichiers

```
backend/
├── src/
│   ├── main.ts                    # Point d'entrée
│   ├── app.module.ts              # Module racine
│   ├── config/
│   │   └── configuration.ts       # Config centralisée
│   ├── common/
│   │   ├── decorators/            # @Roles, @GetUser
│   │   ├── filters/               # HttpExceptionFilter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/          # Future: logging, caching
│   │   └── pipes/                 # Future: validation personnalisée
│   └── modules/
│       ├── auth/                  # Authentification
│       ├── users/                 # Utilisateurs
│       ├── drivers/               # Chauffeurs
│       ├── passengers/            # Passagers
│       ├── rides/                 # Courses
│       ├── location/              # Localisation
│       ├── payments/              # Paiements
│       ├── ratings/               # Notes
│       ├── admin/                 # Admin
│       └── health/                # Santé
├── test/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Flux de Communication

### 1. Inscription/Connexion
```
Client → POST /auth/register → Service → MongoDB → JWT Tokens → Client
```

### 2. Création de Course
```
Passenger → POST /rides → RidesService → MongoDB
                          ↓
                    RidesGateway (WebSocket)
                          ↓
         Broadcast aux chauffeurs proches
                          ↓
         Driver accepte → PATCH /rides/:id/status
```

### 3. Tracking GPS
```
Driver → /location WebSocket → LocationGateway → MongoDB
                                     ↓
                            Broadcast aux passagers
```

## 🎛️ Variables d'Environnement

```env
# Application
NODE_ENV=development                    # development | production
PORT=3000                              # Port de l'API
API_PREFIX=api/v1                      # Préfixe API

# MongoDB
MONGODB_URI=mongodb://mongo:27017/...  # Connexion
MONGODB_USER=taxi_user
MONGODB_PASSWORD=taxi_password_123

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_123
REDIS_DB=0

# JWT
JWT_SECRET=...                         # Secret access token
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=...                 # Secret refresh token
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000,...  # Origins autorisées

# Email
SMTP_HOST, SMTP_PORT, SMTP_USER, ...  # Pour notifications

# Payments (optional)
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, ...

# Maps
GOOGLE_MAPS_API_KEY=...                # Pour calcul d'itinéraires

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## 🚀 Déploiement

### Options de Déploiement

1. **Heroku**
   ```bash
   git push heroku main
   ```

2. **AWS EC2 + RDS + ElastiCache**
   - Déployer l'image Docker
   - Utiliser RDS pour MongoDB (ou self-managed)
   - Utiliser ElastiCache pour Redis

3. **DigitalOcean**
   - App Platform (Docker)
   - Managed Databases (MongoDB, Redis)

4. **Railway**
   ```bash
   railway up
   ```

## 📊 Monitoring & Logging

À implémenter:
- Winston pour le logging structuré
- Sentry pour error tracking
- DataDog ou New Relic pour monitoring
- ELK Stack pour logs centralisés

## 🔄 Intégration Frontend

### Driver App (React Native)
```typescript
// Configuration
const API_URL = 'http://localhost:3000/api/v1';

// Exemple: S'inscrire
const response = await fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'driver@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33612345678',
    password: 'Password@123',
    userType: 'driver'
  })
});

// Exemple: Rejoindre une course (WebSocket)
const socket = io('http://localhost:3000/rides');
socket.emit('join-ride', { rideId, userId });
socket.on('ride-updated', (data) => {
  console.log('Course mise à jour:', data);
});
```

### Passenger App (React Native)
```typescript
// Exemple: Créer une course
const response = await fetch(`${API_URL}/rides`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    passengerId,
    pickupAddress: 'Gare du Nord, Paris',
    pickupLatitude: 48.8809,
    pickupLongitude: 2.3553,
    destinationAddress: 'CDG Airport',
    destinationLatitude: 49.0097,
    destinationLongitude: 2.5479,
    estimatedFare: 55.00
  })
});
```

### Admin Web
```typescript
// Exemple: Récupérer les statistiques
const response = await fetch(`${API_URL}/admin/dashboard`, {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

## 📞 Support & Maintenance

- **Bug Reports**: GitHub Issues
- **Documentation**: docs/ folder
- **Staging**: test.api.example.com
- **Production**: api.example.com

## 📝 License

MIT

---

**Dernière mise à jour**: Décembre 2024
**Version**: 1.0.0
