# Guide de Configuration Backend NestJS + MongoDB

## Prérequis

- Node.js 18+ installé
- MongoDB installé localement ou accès à MongoDB Atlas
- npm ou yarn
- Git

## Étape 1: Initialisation du Projet

```bash
# Installer NestJS CLI globalement
npm install -g @nestjs/cli

# Créer un nouveau projet
nest new taxi-backend

# Entrer dans le dossier
cd taxi-backend
```

## Étape 2: Installation des Dépendances

```bash
# Dépendances MongoDB
npm install @nestjs/mongoose mongoose

# Authentification
npm install @nestjs/passport passport passport-local passport-jwt
npm install @nestjs/jwt bcrypt
npm install -D @types/passport-local @types/passport-jwt @types/bcrypt

# Configuration
npm install @nestjs/config

# Validation
npm install class-validator class-transformer

# WebSocket pour temps réel
npm install @nestjs/websockets @nestjs/platform-socket.io

# Upload de fichiers
npm install @nestjs/platform-express multer
npm install -D @types/multer

# Autres utilitaires
npm install uuid
npm install -D @types/uuid
```

## Étape 3: Configuration de MongoDB

### Option A: MongoDB Local

```bash
# Installer MongoDB sur votre système
# MacOS
brew tap mongodb/brew
brew install mongodb-community

# Démarrer MongoDB
brew services start mongodb-community

# URL de connexion locale
mongodb://localhost:27017/taxi-db
```

### Option B: MongoDB Atlas (Cloud)

1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un nouveau cluster (gratuit)
3. Configurer l'accès réseau (whitelist IP)
4. Créer un utilisateur de base de données
5. Obtenir la chaîne de connexion

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taxi-db?retryWrites=true&w=majority
```

## Étape 4: Configuration de l'Environnement

Créer un fichier `.env` à la racine:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/taxi-db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRATION=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIRECTORY=./uploads

# CORS
CORS_ORIGIN=http://localhost:8081

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

Créer `.env.example` avec les mêmes clés (sans valeurs sensibles).

## Étape 5: Configuration de Base

### Configuration Module (`src/config/configuration.ts`)

```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
    destination: process.env.UPLOAD_DIRECTORY || './uploads',
  },
});
```

### Main.ts Configuration

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Taxi API')
    .setDescription('API for taxi driver management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT');
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
```

### App Module (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
    }),

    // Feature modules (à ajouter plus tard)
    // AuthModule,
    // DriversModule,
    // RidesModule,
  ],
})
export class AppModule {}
```

## Étape 6: Créer les Modules de Base

```bash
# Générer les modules principaux
nest g module auth
nest g module drivers
nest g module rides
nest g module notifications
nest g module documents
nest g module vehicles
nest g module incidents

# Générer les services
nest g service auth
nest g service drivers
nest g service rides
nest g service notifications
nest g service documents
nest g service vehicles
nest g service incidents

# Générer les controllers
nest g controller auth
nest g controller drivers
nest g controller rides
nest g controller notifications
nest g controller documents
nest g controller vehicles
nest g controller incidents
```

## Étape 7: Docker (Optionnel)

Créer `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: taxi-mongodb
    restart: always
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: taxi-db
    volumes:
      - mongodb_data:/data/db

  app:
    build: .
    container_name: taxi-api
    restart: always
    ports:
      - '3000:3000'
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/taxi-db?authSource=admin
    depends_on:
      - mongodb
    volumes:
      - ./src:/app/src
      - ./uploads:/app/uploads

volumes:
  mongodb_data:
```

Créer `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

Démarrer avec Docker:

```bash
docker-compose up -d
```

## Étape 8: Scripts Utiles

Ajouter dans `package.json`:

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "seed": "ts-node src/database/seed.ts"
  }
}
```

## Étape 9: Vérification

Démarrer l'application:

```bash
npm run start:dev
```

Vérifier:
- Application: http://localhost:3000
- Documentation API: http://localhost:3000/api/docs
- MongoDB: Vérifier la connexion dans les logs

## Étape 10: Prochaines Étapes

1. Implémenter l'authentification (voir `03-authentication.md`)
2. Créer les schémas MongoDB (voir `04-database-schemas.md`)
3. Développer les APIs (voir `05-api-implementation.md`)
4. Configurer les WebSockets (voir `06-realtime.md`)
5. Implémenter la migration des données (voir `07-data-migration.md`)

## Ressources

- [Documentation NestJS](https://docs.nestjs.com)
- [Documentation Mongoose](https://mongoosejs.com/docs/guide.html)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Passport.js](http://www.passportjs.org/)
