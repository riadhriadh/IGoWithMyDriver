# ✅ Configuration Backend Complète

## 📦 Ce qui a été ajouté

### 1. Configuration API
- ✅ `lib/api.config.ts` - Configuration centralisée des endpoints
- ✅ `lib/apiClient.ts` - Client HTTP avec gestion automatique des tokens
- ✅ `.env` - Variables d'environnement
- ✅ `.env.example` - Template pour les variables d'environnement

### 2. Services Backend
- ✅ `services/authService.ts` - Authentification (login, register, logout)
- ✅ `services/rideService.ts` - Gestion des courses
- ✅ `services/driverService.ts` - Gestion du profil chauffeur

### 3. Context React
- ✅ `contexts/AuthContextBackend.tsx` - Context d'authentification utilisant le backend

### 4. Documentation
- ✅ `BACKEND_INTEGRATION.md` - Guide complet d'intégration
- ✅ `services/README.md` - Documentation des services
- ✅ `scripts/test-api-connection.ts` - Script de test de connexion

### 5. Dépendances
- ✅ `axios` - Client HTTP installé

## 🚀 Démarrage rapide

### 1. Configuration

Le fichier `.env` a été créé avec la configuration par défaut :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 2. Démarrer le backend

```bash
cd ../backend
npm run start:dev
```

### 3. Tester la connexion (optionnel)

```bash
npx ts-node scripts/test-api-connection.ts
```

### 4. Utiliser dans votre app

#### Option A : Remplacer AuthContext

Dans `app/_layout.tsx`, remplacez :
```typescript
import { AuthProvider } from '@/contexts/AuthContext';
```

Par :
```typescript
import { AuthProvider } from '@/contexts/AuthContextBackend';
```

#### Option B : Utiliser directement les services

Dans n'importe quel écran :
```typescript
import { authService } from '@/services/authService';
import { rideService } from '@/services/rideService';
import { driverService } from '@/services/driverService';

// Login
await authService.login({ email, password });

// Get rides
const rides = await rideService.getAvailableRides();

// Update status
await driverService.updateStatus('available');
```

## 📱 Test sur appareil physique

Si vous testez sur un appareil physique, mettez à jour `.env` :

```bash
# Trouvez votre IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Mettez à jour .env
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api/v1
```

## 🔧 Fonctionnalités du API Client

Le client API gère automatiquement :

✅ **Authentification JWT** - Ajout automatique du token dans les headers
✅ **Refresh automatique** - Renouvellement du token quand il expire
✅ **File d'attente** - Gestion des requêtes pendant le refresh
✅ **Gestion d'erreurs** - Formatage uniforme des erreurs
✅ **Network errors** - Détection des problèmes réseau
✅ **TypeScript** - Tous les types sont définis

## 📚 Exemples d'utilisation

### Login
```typescript
import { authService } from '@/services/authService';

try {
  const response = await authService.login({
    email: 'driver@example.com',
    password: 'password123'
  });
  
  console.log('Logged in:', response.user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Liste des courses
```typescript
import { rideService } from '@/services/rideService';

const rides = await rideService.getAvailableRides({
  latitude: 48.8566,
  longitude: 2.3522
});

console.log('Available rides:', rides);
```

### Accepter une course
```typescript
await rideService.acceptRide('ride-id', {
  estimatedArrivalTime: 5
});
```

### Mettre à jour le statut
```typescript
import { driverService } from '@/services/driverService';

await driverService.updateStatus('available');
```

### Consulter les gains
```typescript
const earnings = await driverService.getEarnings();
console.log('Today:', earnings.today);
console.log('This week:', earnings.week);
console.log('This month:', earnings.month);
```

## 🎯 Prochaines étapes

1. [ ] Mettre à jour les écrans pour utiliser les nouveaux services
2. [ ] Implémenter WebSockets pour le real-time
3. [ ] Ajouter React Query pour le cache et la gestion d'état
4. [ ] Implémenter la mise à jour automatique de la localisation
5. [ ] Ajouter des tests unitaires pour les services

## 📖 Documentation complète

Consultez `BACKEND_INTEGRATION.md` pour :
- Guide détaillé de migration
- Exemples complets d'utilisation
- Architecture et flux de données
- Gestion des erreurs
- WebSocket et real-time

## ⚙️ Endpoints disponibles

Tous les endpoints sont définis dans `lib/api.config.ts` :

**Auth:**
- POST `/auth/login`
- POST `/auth/register`
- POST `/auth/logout`
- POST `/auth/refresh`
- GET `/auth/profile`

**Drivers:**
- GET `/drivers/profile`
- PATCH `/drivers/profile`
- PATCH `/drivers/status`
- POST `/drivers/location`
- GET `/drivers/earnings`
- GET `/drivers/stats`

**Rides:**
- GET `/rides` (available rides)
- GET `/rides/active`
- GET `/rides/history`
- POST `/rides/:id/accept`
- POST `/rides/:id/start`
- POST `/rides/:id/complete`
- POST `/rides/:id/cancel`

## 🐛 Débogage

Si vous rencontrez des problèmes :

1. **Vérifiez que le backend est démarré**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Vérifiez la configuration**
   ```bash
   cat .env
   ```

3. **Testez la connexion**
   ```bash
   npx ts-node scripts/test-api-connection.ts
   ```

4. **Vérifiez les logs du backend**
   ```bash
   cd ../backend
   npm run start:dev
   ```

## 🎉 Vous êtes prêt !

L'application driver est maintenant configurée pour consommer les API du backend NestJS.

Vous pouvez commencer à utiliser les services dans vos écrans !

