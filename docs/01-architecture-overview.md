# Architecture Backend NestJS + MongoDB

## Vue d'ensemble

Ce document décrit l'architecture du backend qui remplacera Supabase pour l'application de gestion de courses de taxi.

## Stack Technique

- **Framework**: NestJS (Node.js)
- **Base de données**: MongoDB
- **ORM**: Mongoose
- **Authentification**: JWT + Passport
- **Validation**: class-validator
- **Documentation API**: Swagger/OpenAPI
- **Tests**: Jest
- **WebSockets**: Socket.io (pour temps réel)

## Architecture Globale

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│   API Gateway   │
│   (NestJS)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│  Auth │ │ Rides│
│Module │ │Module│
└───┬───┘ └──┬───┘
    │        │
┌───▼────────▼───┐
│    MongoDB     │
└────────────────┘
```

## Modules Principaux

### 1. Auth Module
- Inscription/Connexion des chauffeurs
- Gestion des tokens JWT
- Refresh tokens
- Protection des routes

### 2. Drivers Module
- Profils chauffeurs
- Statuts (disponible/occupé)
- Localisation en temps réel
- Documents et vérifications

### 3. Rides Module
- Création de courses
- Gestion du cycle de vie des courses
- Transitions de statuts
- Historique

### 4. Notifications Module
- Push notifications (FCM/APNS)
- Notifications en temps réel via WebSocket
- Préférences utilisateur

### 5. Documents Module
- Upload de fichiers
- Gestion des documents chauffeur
- Vérification et validation

### 6. Vehicles Module
- Gestion des véhicules
- Association chauffeur-véhicule
- Informations techniques

### 7. Incidents Module
- Déclaration d'incidents
- Photos et détails
- Suivi et résolution

## Avantages vs Supabase

### Avantages NestJS + MongoDB

✅ **Contrôle total** du backend
✅ **Logique métier complexe** plus facile à implémenter
✅ **Flexibilité** dans la structure des données (MongoDB)
✅ **Performance** optimisée pour vos besoins spécifiques
✅ **Tests** plus faciles et complets
✅ **Évolutivité** personnalisée
✅ **Pas de vendor lock-in**

### Inconvénients

❌ Plus de code à maintenir
❌ Infrastructure à gérer (base de données, hébergement)
❌ Authentification à implémenter manuellement
❌ Temps de développement plus long
❌ Coûts d'hébergement potentiellement plus élevés

## Structure du Projet

```
taxi-backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   ├── drivers/
│   │   ├── drivers.controller.ts
│   │   ├── drivers.service.ts
│   │   ├── drivers.module.ts
│   │   └── schemas/
│   │       └── driver.schema.ts
│   ├── rides/
│   │   ├── rides.controller.ts
│   │   ├── rides.service.ts
│   │   ├── rides.module.ts
│   │   ├── rides.gateway.ts (WebSocket)
│   │   └── schemas/
│   │       └── ride.schema.ts
│   ├── notifications/
│   ├── documents/
│   ├── vehicles/
│   ├── incidents/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   │   └── configuration.ts
│   └── main.ts
├── test/
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Base de Données MongoDB

### Collections Principales

1. **drivers**
   - Informations des chauffeurs
   - Statuts et disponibilité
   - Documents et vérifications

2. **rides**
   - Toutes les courses
   - Historique des statuts
   - Timestamps de transitions

3. **vehicles**
   - Informations des véhicules
   - Assurances et contrôles techniques

4. **documents**
   - Fichiers uploadés
   - Métadonnées

5. **incidents**
   - Déclarations d'incidents
   - Photos et détails

6. **notifications**
   - Historique des notifications
   - Préférences

## Sécurité

### Authentification
- JWT tokens (access + refresh)
- Hash des mots de passe (bcrypt)
- Rate limiting
- CORS configuré

### Autorisation
- Guards personnalisés
- Decorators pour les rôles
- Validation des permissions

### Données
- Validation des entrées (class-validator)
- Sanitisation des données
- Encryption des données sensibles

## Performance

### Optimisations
- Indexation MongoDB
- Cache (Redis)
- Pagination
- Compression des réponses
- CDN pour les fichiers statiques

### Monitoring
- Logs structurés
- Métriques (Prometheus)
- Alertes
- Health checks

## Déploiement

### Options d'hébergement
1. **AWS**
   - EC2 pour l'application
   - MongoDB Atlas
   - S3 pour les fichiers

2. **Google Cloud Platform**
   - Cloud Run
   - MongoDB Atlas
   - Cloud Storage

3. **DigitalOcean**
   - Droplets
   - Managed MongoDB
   - Spaces

4. **Heroku** (plus simple mais plus cher)
   - Add-ons MongoDB
   - Add-ons Redis

## Migration depuis Supabase

Voir les documents suivants:
- `02-migration-plan.md` - Plan de migration détaillé
- `03-data-migration.md` - Scripts de migration de données
- `04-api-mapping.md` - Correspondance des APIs
