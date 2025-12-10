# Setup Guide - Installation Complète

## 📋 Prérequis

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** 8+ ou **yarn** 3+
- **Docker** & **Docker Compose** (optionnel pour dev local)
- **MongoDB** 5+ (local ou Atlas)
- **Redis** 6+ (local ou cloud)
- **Git** (pour versionning)

## 🚀 Installation Étape par Étape

### 1. Cloner le Repository

```bash
cd application/backvtc
git clone <repo-url> backend
cd backend
```

### 2. Installer les Dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration de l'Environnement

#### Option A: Avec Docker Compose (Recommandé pour dev)

```bash
# 1. Copier l'exemple d'env
cp .env.example .env

# 2. Variables par défaut - pas besoin de modifier
# - MongoDB: mongodb://mongo:27017/taxi-vtc
# - Redis: redis:6379
# - Port: 3000

# 3. Démarrer les services
docker-compose up -d

# 4. Vérifier le statut
docker-compose ps
```

#### Option B: Setup Local Manual

##### MongoDB

**macOS (avec Homebrew)**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Créer la base et l'utilisateur
mongo admin
> db.createUser({
>   user: "taxi_user",
>   pwd: "taxi_password_123",
>   roles: [{ role: "readWrite", db: "taxi-vtc" }]
> })
```

**Linux (Ubuntu/Debian)**
```bash
# Importer la clé GPG
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Ajouter le repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installer
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows**
```bash
# Via Chocolatey
choco install mongodb

# Ou télécharger depuis: https://www.mongodb.com/try/download/community
```

##### Redis

**macOS**
```bash
brew install redis
brew services start redis
```

**Linux**
```bash
# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis-server

# CentOS
sudo yum install redis
sudo systemctl start redis
```

**Windows**
```bash
# Via Chocolatey
choco install redis-64

# Ou utiliser WSL2 avec Linux
```

### 4. Configuration Fichier `.env`

Créer `.env` à la racine du projet:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/taxi-vtc
MONGODB_USER=taxi_user
MONGODB_PASSWORD=taxi_password_123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_123
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-please
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8081

# Fichiers
MAX_FILE_SIZE=5242880
UPLOAD_DIRECTORY=./uploads

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxx

# Google Maps (optionnel)
GOOGLE_MAPS_API_KEY=your-api-key

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 5. Démarrer l'Application

```bash
# Mode développement (hot reload)
npm run start:dev

# Mode production
npm run build
npm run start:prod

# Mode debug
npm run start:debug
```

### 6. Vérifier l'Installation

Ouvrir dans le navigateur:

1. **Health Check**: http://localhost:3000/api/v1/health
2. **Swagger API Docs**: http://localhost:3000/api/v1/docs
3. **MongoDB Admin** (si Docker): http://localhost:8081

Output attendu:
```json
{
  "status": "ok",
  "timestamp": "2024-12-10T...",
  "uptime": 12.345,
  "environment": "development"
}
```

## 🔧 Commandes Utiles

```bash
# Installation
npm install                    # Installer les dépendances
npm ci                        # Installation stricte

# Développement
npm run start:dev             # Start avec auto-reload
npm run start:debug           # Debug mode

# Production
npm run build                 # Compiler TypeScript
npm run start:prod            # Démarrer l'app compilée

# Code Quality
npm run lint                  # Vérifier avec ESLint
npm run format                # Formater avec Prettier
npm run test                  # Tests unitaires
npm run test:cov              # Couverture de test

# Docker
docker-compose up -d          # Démarrer les services
docker-compose down           # Arrêter les services
docker-compose logs -f api    # Voir les logs
docker-compose ps             # Status des services

# Database
mongosh --username taxi_user --password taxi_password_123 --authenticationDatabase admin
```

## 🧪 Premier Test de l'API

### Avec cURL

```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33612345678",
    "password": "Password@123"
  }'

# Réponse attendue
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

# 2. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password@123"
  }'

# 3. Récupérer le profil
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Avec Postman

1. Importer les requests depuis Swagger UI
2. Définir variable `{{base_url}}`: http://localhost:3000/api/v1
3. Utiliser l'authentification Bearer Token

### Avec Insomnia

Même approche que Postman.

## 🗄️ Vérifier MongoDB

### Via CLI

```bash
# Connexion
mongosh --username taxi_user --password taxi_password_123 \
  --authenticationDatabase admin \
  --host localhost

# Utiliser la DB
use taxi-vtc

# Voir les collections
show collections

# Compter les documents
db.users.countDocuments()

# Voir un utilisateur
db.users.findOne()
```

### Via Interface Web (Docker)

Aller à: http://localhost:8081
- User: admin
- Password: pass

## 🚨 Dépannage Courant

### Erreur: MongoDB Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Vérifier que MongoDB tourne
# macOS
brew services list

# Linux
sudo systemctl status mongod

# Ou avec Docker
docker-compose up -d mongo
```

### Erreur: Redis Connection Refused

```
Error: Connection refused
```

**Solution:**
```bash
# Vérifier Redis
redis-cli ping  # Doit afficher: PONG

# Ou avec Docker
docker-compose up -d redis
```

### Erreur: Port 3000 déjà utilisé

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Changer le port dans .env
PORT=3001

# Ou tuer le processus (macOS/Linux)
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erreur: ValidationPipe

```
BadRequestException: Invalid input
```

**Solution:** Vérifier les DTOs - certains champs obligatoires manquent

## 📦 Dépendances Principales

```json
{
  "@nestjs/common": "Core framework",
  "@nestjs/mongoose": "MongoDB driver",
  "@nestjs/jwt": "JWT tokens",
  "@nestjs/passport": "Authentification",
  "@nestjs/config": "Configuration",
  "mongoose": "MongoDB ODM",
  "redis": "Cache store",
  "socket.io": "WebSocket",
  "bcryptjs": "Password hashing",
  "class-validator": "DTO validation",
  "swagger": "API docs"
}
```

## 🔐 Secrets en Production

**IMPORTANT:** Ne jamais commiter `.env` avec les vraies clés!

Pour production, utiliser:
- **AWS Secrets Manager**
- **Google Cloud Secret Manager**
- **HashiCorp Vault**
- **Heroku Config Vars**
- **DigitalOcean App Spec**

Exemple avec GitHub Secrets:
```yaml
# .github/workflows/deploy.yml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

## 📚 Ressources

- [NestJS Docs](https://docs.nestjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Redis Docs](https://redis.io/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Passport Docs](http://www.passportjs.org)

## ✅ Checklist Installation

- [ ] Node.js 18+ installé
- [ ] npm/yarn fonctionnel
- [ ] MongoDB en cours d'exécution
- [ ] Redis en cours d'exécution
- [ ] `.env` créé et configuré
- [ ] `npm install` exécuté
- [ ] `npm run start:dev` fonctionne
- [ ] http://localhost:3000/api/v1/health retourne `ok`
- [ ] Swagger UI accessible

## 🚀 Prochaines Étapes

1. Lire [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Explorer les endpoints Swagger
3. Faire les tests cURL
4. Configurer votre IDE/éditeur
5. Commencer le développement!

---

**Questions?** Vérifier la section Dépannage ou ouvrir une issue.
