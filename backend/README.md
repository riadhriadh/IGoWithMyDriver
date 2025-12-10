# Taxi VTC Backend - NestJS + MongoDB + Redis

Backend microservices pour une application de taxi VTC complète avec support pour:
- 📱 **App Driver** (React Native)
- 👥 **App Passenger** (React Native)  
- 🖥️ **Admin Dashboard** (Web)

## ✨ Features

- ✅ Authentication JWT avec Refresh Tokens
- ✅ Gestion des courses avec statuts validés
- ✅ Tracking GPS en temps réel (WebSocket)
- ✅ Système de notation et avis
- ✅ Gestion des paiements
- ✅ Dashboard administratif
- ✅ Swagger API Documentation
- ✅ Docker Compose pour développement
- ✅ MongoDB avec indexes optimisés
- ✅ Redis pour cache et sessions
- ✅ Role-based access control (RBAC)

## 🚀 Quick Start

### 1. Cloner et installer

```bash
cd backend
npm install
```

### 2. Configuration

```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

### 3. Démarrer les services

```bash
# Option A: Avec Docker Compose
docker-compose up -d

# Option B: Manuel
# - Démarrer MongoDB localement
# - Démarrer Redis localement
# - npm run start:dev
```

### 4. Vérifier

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/v1/docs
- **Health Check**: http://localhost:3000/api/v1/health
- **MongoDB Admin**: http://localhost:8081 (admin/pass)

## 📚 Documentation

- **[Architecture Complète](./ARCHITECTURE.md)** - Vue d'ensemble, modules, API
- **[Setup Guide](./docs/SETUP.md)** - Installation détaillée
- **[API Reference](./docs/API.md)** - Endpoints et exemples
- **[WebSocket Events](./docs/WEBSOCKET.md)** - Événements temps réel
- **[Deployment](./docs/DEPLOYMENT.md)** - Déploiement production

## 🏗️ Structure du Projet

```
backend/
├── src/
│   ├── main.ts                  # Point d'entrée
│   ├── app.module.ts            # Module racine
│   ├── config/                  # Configuration
│   ├── common/                  # Guards, Decorators, Filters
│   └── modules/                 # Modules métier
│       ├── auth/                # Authentification
│       ├── users/               # Utilisateurs
│       ├── drivers/             # Chauffeurs
│       ├── passengers/          # Passagers
│       ├── rides/               # Courses
│       ├── location/            # Localisation
│       ├── payments/            # Paiements
│       ├── ratings/             # Notes
│       ├── admin/               # Admin
│       └── health/              # Health Check
├── docker-compose.yml           # Services (MongoDB, Redis)
├── Dockerfile                   # Build production
├── .env.example                 # Variables d'environnement
├── tsconfig.json                # Config TypeScript
├── package.json                 # Dépendances
└── ARCHITECTURE.md              # Documentation architecture
```

## 🛠️ Commandes

```bash
# Développement
npm run start:dev              # Hot reload
npm run start:debug            # Debug mode

# Production
npm run build                  # Build
npm run start:prod             # Démarrer

# Tests
npm test                       # Tests unitaires
npm run test:watch            # Watch mode
npm run test:cov              # Couverture
npm run test:e2e              # Tests e2e

# Linting
npm run lint                   # ESLint
npm run format                 # Prettier
```

## 🔐 Sécurité

- **JWT** tokens (access + refresh)
- **Bcryptjs** pour hash des passwords
- **CORS** configurable
- **Validation** avec class-validator
- **SQL Injection** protection (MongoDB)
- **Rate Limiting** (ready to implement)

## 🗄️ Base de Données

### MongoDB Collections
- `users` - Utilisateurs (driver, passenger, admin)
- `drivers` - Profils chauffeurs
- `passengers` - Profils passagers
- `rides` - Courses
- `locations` - Historique GPS
- `payments` - Transactions
- `ratings` - Notes et avis

### Redis Keys
- `auth:session:{userId}` - Sessions actives
- `location:driver:{driverId}` - Position actuelle
- `ride:active:{rideId}` - Courses actives

## 📡 API Endpoints

### Auth
```
POST   /auth/register       # S'inscrire
POST   /auth/login          # Se connecter
POST   /auth/refresh        # Renouveler token
POST   /auth/logout         # Se déconnecter
GET    /auth/me             # Profil actuel
```

### Drivers
```
GET    /drivers/profile     # Profil du chauffeur
PATCH  /drivers/profile     # Mettre à jour
GET    /drivers/nearby      # Chauffeurs proches
PATCH  /drivers/:id/status  # Changer le statut
PATCH  /drivers/:id/location # Mettre à jour position
```

### Passengers
```
GET    /passengers/profile  # Profil du passager
PATCH  /passengers/profile  # Mettre à jour
```

### Rides
```
POST   /rides               # Créer une course
GET    /rides/:id           # Détails
GET    /rides               # Mes courses
PATCH  /rides/:id           # Mettre à jour
PATCH  /rides/:id/status    # Changer le statut
DELETE /rides/:id           # Annuler
```

### Ratings
```
POST   /ratings             # Créer une note
GET    /ratings/ride/:id    # Notes pour une course
GET    /ratings/driver/:id/average # Note moyenne
```

### Payments
```
GET    /payments            # Historique
GET    /payments/:id        # Détails
```

### Admin
```
GET    /admin/dashboard     # Statistiques
GET    /admin/users         # Utilisateurs
GET    /admin/drivers       # Chauffeurs
GET    /admin/passengers    # Passagers
```

## 🌐 WebSocket Events

### Rides (`/rides` namespace)
```javascript
// Client
socket.emit('join-ride', { rideId, userId })
socket.emit('ride-update', { rideId, data })
socket.emit('driver-location', { rideId, latitude, longitude })

// Server
socket.on('ride-updated', (data) => {})
socket.on('driver-location-updated', (data) => {})
```

### Location (`/location` namespace)
```javascript
// Client
socket.emit('register-driver', { driverId })
socket.emit('location-update', { driverId, latitude, longitude })

// Server
socket.on('location-updated', (data) => {})
```

## 🧪 Testing

### Exemple avec cURL

```bash
# Inscription
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33612345678",
    "password": "Password@123",
    "userType": "driver"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "Password@123"
  }'

# Récupérer le profil (avec token)
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/auth/me
```

## 🐳 Docker

### Services inclus

- **MongoDB** (27017)
  - Admin UI: http://localhost:8081
  - User: taxi_user / Password: taxi_password_123

- **Redis** (6379)
  - Password: redis_password_123

- **API** (3000)
  - Swagger: http://localhost:3000/api/v1/docs

### Commandes

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f api

# Arrêter
docker-compose down

# Supprimer les volumes
docker-compose down -v
```

## 🚀 Déploiement

### Préparation

```bash
# 1. Build l'image Docker
docker build -t taxi-vtc-api .

# 2. Push sur registry (DockerHub, ECR, etc.)
docker tag taxi-vtc-api:latest myregistry/taxi-vtc-api:latest
docker push myregistry/taxi-vtc-api:latest
```

### Options de Déploiement

- **Heroku** - `git push heroku main`
- **Railway** - `railway up`
- **AWS ECS** - ECR + Fargate
- **DigitalOcean** - App Platform
- **VPS Linux** - Docker + Nginx + PM2

## 📊 Monitoring

À implémenter:
- Winston logger
- Sentry error tracking
- DataDog monitoring
- ELK stack

## 🤝 Contributing

1. Fork le repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT

## 📞 Support

- **Issues**: GitHub Issues
- **Email**: support@taxi-vtc.app
- **Docs**: ARCHITECTURE.md

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: December 2024
