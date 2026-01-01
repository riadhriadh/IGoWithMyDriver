# État de la Migration Supabase → Backend API

## ✅ Fichiers migrés

### Contexts
- [x] `contexts/AuthContext.tsx` - Utilise maintenant `authService`
- [x] `contexts/LocationContext.tsx` - Utilise maintenant `apiClient`

### Services
- [x] `services/authService.ts` - Nouveau service d'authentification
- [x] `services/rideService.ts` - Nouveau service de courses
- [x] `services/driverService.ts` - Nouveau service chauffeur
- [x] `services/locationService.ts` - Migré vers backend API
- [x] `services/documentService.ts` - Migré vers backend API
- [x] `services/backgroundLocationService.ts` - Migré vers backend API
- [x] `services/notificationService.ts` - Migré vers backend API

### Lib
- [x] `lib/api.config.ts` - Configuration des endpoints
- [x] `lib/apiClient.ts` - Client HTTP avec JWT
- [x] `lib/supabase.ts` - **SUPPRIMÉ**

### Écrans principaux
- [x] `app/(tabs)/index.tsx` - Écran des courses
- [x] `app/(tabs)/profile.tsx` - Écran du profil

### Supprimé
- [x] `supabase/` - Dossier de migrations supprimé
- [x] `@supabase/supabase-js` - Package désinstallé
- [x] `react-native-url-polyfill` - Package désinstallé

## ⏳ Fichiers à migrer

Ces fichiers utilisent encore des imports Supabase qui n'existent plus.
Ils doivent être mis à jour pour utiliser les services backend.

### Écrans tabs
- [ ] `app/(tabs)/earnings.tsx` - Écran des gains
- [ ] `app/(tabs)/planning.tsx` - Écran du planning

### Véhicules
- [ ] `app/vehicles/index.tsx` - Liste des véhicules
- [ ] `app/vehicles/add.tsx` - Ajouter un véhicule

### Historique
- [ ] `app/history/index.tsx` - Historique des courses
- [ ] `app/history/[id].tsx` - Détail d'une course passée

### Courses
- [ ] `app/rides/[id].tsx` - Détail d'une course

### Incidents
- [ ] `app/incidents/index.tsx` - Liste des incidents
- [ ] `app/incidents/create.tsx` - Créer un incident

### Profil
- [ ] `app/profile/edit.tsx` - Modifier le profil

### Tracking
- [ ] `app/tracking/index.tsx` - Écran de tracking

## 🔧 Comment migrer un fichier

### 1. Supprimer l'import Supabase
```typescript
// AVANT
import { supabase } from '@/lib/supabase';

// APRÈS
import { apiClient } from '@/lib/apiClient';
import { rideService } from '@/services/rideService';
import { driverService } from '@/services/driverService';
```

### 2. Remplacer les appels Supabase

**Lecture de données :**
```typescript
// AVANT
const { data, error } = await supabase
  .from('rides')
  .select('*')
  .eq('driver_id', userId);

// APRÈS
const rides = await rideService.getRideHistory();
```

**Mise à jour de données :**
```typescript
// AVANT
await supabase
  .from('drivers')
  .update({ status: 'available' })
  .eq('id', userId);

// APRÈS
await driverService.updateStatus('available');
```

**Insertion de données :**
```typescript
// AVANT
await supabase
  .from('vehicles')
  .insert([{ make: 'Toyota', model: 'Camry' }]);

// APRÈS
await apiClient.post('/drivers/vehicles', { make: 'Toyota', model: 'Camry' });
```

### 3. Mettre à jour le type user

```typescript
// AVANT
const { user } = useAuth(); // user est de type User (Supabase)

// APRÈS
const { user } = useAuth(); // user est de type DriverProfile
```

**Propriétés disponibles sur DriverProfile :**
- `id: string`
- `email: string`
- `fullName: string`
- `phone: string`
- `avatarUrl?: string`
- `status: 'offline' | 'available' | 'busy' | 'on_ride'`
- `vehicleInfo?: { make, model, year, licensePlate, color }`
- `rating?: number`
- `totalRides?: number`

## 📝 Services disponibles

### authService
```typescript
authService.login({ email, password })
authService.register({ email, password, fullName, phone })
authService.logout()
authService.getProfile()
authService.isAuthenticated()
```

### rideService
```typescript
rideService.getAvailableRides(location?)
rideService.getActiveRide()
rideService.getRideHistory(page, limit)
rideService.getRideById(id)
rideService.acceptRide(rideId, data?)
rideService.startRide(rideId)
rideService.completeRide(rideId, data)
rideService.cancelRide(rideId, data)
```

### driverService
```typescript
driverService.getProfile()
driverService.updateProfile(data)
driverService.updateStatus(status)
driverService.updateLocation(location)
driverService.getEarnings()
driverService.getStats()
```

### locationService
```typescript
locationService.updateDriverLocation(driverId, lat, lng)
locationService.updateLocationFull(data)
locationService.getLocationHistory(startDate?, endDate?)
locationService.calculateDistance(lat1, lon1, lat2, lon2)
locationService.getCurrentPosition()
locationService.openNavigationApp(destination, app)
```

### documentService
```typescript
documentService.pickDocument()
documentService.pickImage()
documentService.takePhoto()
documentService.uploadDocument(driverId, file, type, expiryDate?)
documentService.getDocuments(driverId)
documentService.deleteDocument(documentId, fileUrl)
```

### notificationService
```typescript
notificationService.requestPermissions()
notificationService.registerForPushNotifications()
notificationService.savePushToken(driverId, token)
notificationService.sendLocalNotification(title, body, data?)
notificationService.notifyNewRide(rideDetails)
notificationService.savePreferences(driverId, preferences)
notificationService.getPreferences(driverId)
```

## 🚀 Exécuter l'app

Pour tester, assurez-vous que le backend est démarré :

```bash
# Terminal 1 - Backend
cd ../backend
docker-compose up -d mongo redis
npm run start:dev

# Terminal 2 - App
cd gowithmydriver
npm run dev
```

## ⚠️ Notes importantes

1. **Les écrans non migrés ne fonctionneront pas** car `@/lib/supabase` n'existe plus.

2. **Le backend doit être démarré** pour que l'app fonctionne.

3. **Mettre à jour `.env`** si nécessaire :
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
   ```

4. **Pour appareil physique**, utilisez votre IP locale :
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api/v1
   ```

---

**Dernière mise à jour :** 2025-12-11

