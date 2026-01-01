# Services

Ce dossier contient les services pour interagir avec le backend API et les fonctionnalités de l'application.

## Services Backend API

### authService.ts
Service d'authentification avec le backend NestJS.

**Fonctionnalités :**
- Login / Register
- Logout
- Get Profile
- Refresh Token

**Exemple :**
```typescript
import { authService } from '@/services/authService';

const response = await authService.login({
  email: 'driver@example.com',
  password: 'password123'
});
```

### rideService.ts
Service de gestion des courses.

**Fonctionnalités :**
- Lister les courses disponibles
- Accepter une course
- Démarrer une course
- Compléter une course
- Annuler une course
- Historique des courses

**Exemple :**
```typescript
import { rideService } from '@/services/rideService';

// Récupérer les courses disponibles
const rides = await rideService.getAvailableRides({
  latitude: 48.8566,
  longitude: 2.3522
});

// Accepter une course
await rideService.acceptRide('ride-id');
```

### driverService.ts
Service de gestion du profil chauffeur.

**Fonctionnalités :**
- Mettre à jour le profil
- Changer le statut (online/offline)
- Mettre à jour la localisation
- Consulter les gains
- Consulter les statistiques

**Exemple :**
```typescript
import { driverService } from '@/services/driverService';

// Passer en ligne
await driverService.updateStatus('available');

// Mettre à jour la localisation
await driverService.updateLocation({
  latitude: 48.8566,
  longitude: 2.3522,
  heading: 90,
  speed: 30
});

// Consulter les gains
const earnings = await driverService.getEarnings();
console.log(earnings); // { today: 150, week: 800, month: 3200 }
```

## Services Locaux

### backgroundLocationService.ts
Service de tracking GPS en arrière-plan (utilise Expo Location).

### documentService.ts
Service de gestion des documents du chauffeur.

### locationService.ts
Service de localisation en temps réel.

### notificationService.ts
Service de notifications push.

## Configuration

Assurez-vous d'avoir configuré le fichier `.env` :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Gestion des erreurs

Tous les services backend gèrent les erreurs de manière uniforme :

```typescript
try {
  await rideService.acceptRide(rideId);
} catch (error) {
  console.error(error.message);
  console.error(error.statusCode);
  console.error(error.errors); // Validation errors
}
```

## Authentification automatique

Le `apiClient` gère automatiquement :
- Ajout du token JWT dans les headers
- Refresh automatique du token quand il expire
- Gestion de la file d'attente des requêtes pendant le refresh

Vous n'avez pas besoin de gérer manuellement les tokens !

## TypeScript

Tous les services sont typés avec TypeScript pour une meilleure autocomplétion et détection d'erreurs.

```typescript
import { Ride, Location } from '@/services/rideService';
import { DriverProfile } from '@/services/authService';
import { DriverEarnings, DriverStats } from '@/services/driverService';
```

## Documentation complète

Voir `BACKEND_INTEGRATION.md` pour plus de détails et des exemples complets.

