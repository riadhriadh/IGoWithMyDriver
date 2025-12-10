# LocationContext - Guide d'Utilisation

## Vue d'ensemble

Le `LocationContext` fournit une API complète pour gérer le tracking GPS en arrière-plan avec Supabase. Il suit la même structure que votre code existant avec des améliorations pour l'intégration Supabase.

## Installation dans votre App

### 1. Wrapper votre App avec le LocationProvider

Dans `app/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <LocationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </LocationProvider>
    </AuthProvider>
  );
}
```

**Important**: Le `LocationProvider` doit être à l'intérieur de `AuthProvider` car il dépend de l'utilisateur connecté.

### 2. Utiliser le Hook dans vos Composants

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';

function MyScreen() {
  const {
    location,
    isTracking,
    isBackgroundTracking,
    error,
    startTracking,
    stopTracking,
    startBackgroundTracking,
    stopBackgroundTracking,
    toggleBackgroundTracking,
    setCurrentRide,
    updateDriverStatus,
    setActiveVehicle,
  } = useLocationTracking();

  return (
    <View>
      <Text>Tracking: {isBackgroundTracking ? 'Actif' : 'Inactif'}</Text>
      <Button title="Toggle" onPress={toggleBackgroundTracking} />
    </View>
  );
}
```

## API Complète

### État

#### `location: LocationObject | null`
Position GPS actuelle du chauffeur.

```typescript
if (location) {
  console.log(location.coords.latitude, location.coords.longitude);
}
```

#### `isTracking: boolean`
Indique si le tracking est actif (foreground).

#### `isBackgroundTracking: boolean`
Indique si le tracking en arrière-plan est actif.

#### `error: string | null`
Message d'erreur s'il y en a un.

### Méthodes

#### `startTracking()`
Démarre le tracking en premier plan.

```typescript
await startTracking();
```

#### `stopTracking()`
Arrête le tracking (foreground et background).

```typescript
await stopTracking();
```

#### `startBackgroundTracking()`
Démarre le tracking en arrière-plan.

```typescript
await startBackgroundTracking();
```

#### `stopBackgroundTracking()`
Arrête uniquement le tracking en arrière-plan.

```typescript
await stopBackgroundTracking();
```

#### `toggleBackgroundTracking()`
Bascule entre activer/désactiver le tracking.

```typescript
await toggleBackgroundTracking();
```

#### `setCurrentRide(rideId: string | null)`
Associe une course au tracking.

```typescript
// Démarrer une course
await setCurrentRide('ride-uuid-123');

// Terminer une course
await setCurrentRide(null);
```

#### `updateDriverStatus(isOnline: boolean, isAvailable: boolean)`
Met à jour le statut du chauffeur.

```typescript
// Se mettre en ligne et disponible
await updateDriverStatus(true, true);

// Se mettre hors ligne
await updateDriverStatus(false, false);
```

#### `setActiveVehicle(vehicleId: string | null)`
Définit le véhicule actif pour le tracking.

```typescript
await setActiveVehicle('vehicle-uuid-123');
```

## Exemples d'Utilisation

### Écran de Profil avec Tracking

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  const { isBackgroundTracking, toggleBackgroundTracking } = useLocationTracking();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Tracking GPS</Text>
        <Switch
          value={isBackgroundTracking}
          onValueChange={toggleBackgroundTracking}
        />
      </View>
    </View>
  );
}
```

### Gestion des Courses

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';
import { Button } from 'react-native';

export default function RideScreen({ route }) {
  const { rideId } = route.params;
  const { setCurrentRide, startBackgroundTracking } = useLocationTracking();

  const acceptRide = async () => {
    // Démarrer le tracking si pas déjà actif
    await startBackgroundTracking();

    // Associer la course
    await setCurrentRide(rideId);

    // Naviguer vers l'écran de course
  };

  const completeRide = async () => {
    // Dissocier la course
    await setCurrentRide(null);

    // Le tracking continue pour être prêt pour la prochaine course
  };

  return (
    <View>
      <Button title="Accepter la course" onPress={acceptRide} />
      <Button title="Terminer la course" onPress={completeRide} />
    </View>
  );
}
```

### Statut du Chauffeur

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';
import { View, Button } from 'react-native';

export default function StatusScreen() {
  const {
    isBackgroundTracking,
    startBackgroundTracking,
    stopBackgroundTracking,
    updateDriverStatus,
  } = useLocationTracking();

  const goOnline = async () => {
    await updateDriverStatus(true, true);
    await startBackgroundTracking();
  };

  const goOffline = async () => {
    await updateDriverStatus(false, false);
    await stopBackgroundTracking();
  };

  return (
    <View>
      {!isBackgroundTracking ? (
        <Button title="Se mettre en ligne" onPress={goOnline} />
      ) : (
        <Button title="Se mettre hors ligne" onPress={goOffline} />
      )}
    </View>
  );
}
```

### Sélection de Véhicule

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function VehicleSelector() {
  const { setActiveVehicle } = useLocationTracking();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true);

    setVehicles(data || []);
  };

  const selectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    await setActiveVehicle(vehicle.id);
  };

  return (
    <View>
      {vehicles.map(vehicle => (
        <TouchableOpacity
          key={vehicle.id}
          onPress={() => selectVehicle(vehicle)}
        >
          <Text>{vehicle.brand} {vehicle.model}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## Composant UI Prêt à l'Emploi

Utilisez le composant `TrackingControlContext`:

```typescript
import TrackingControlContext from '@/components/TrackingControlContext';

export default function SettingsScreen() {
  return (
    <View style={{ padding: 20 }}>
      <TrackingControlContext />
    </View>
  );
}
```

## Flux de Travail Complet

### 1. Au Démarrage de l'App

```typescript
// Dans app/_layout.tsx ou un écran d'initialisation
import { useLocationTracking } from '@/contexts/LocationContext';
import { useEffect } from 'react';

export default function InitScreen() {
  const { startBackgroundTracking, setActiveVehicle } = useLocationTracking();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Charger le véhicule par défaut
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (vehicle) {
      await setActiveVehicle(vehicle.id);
    }

    // Démarrer le tracking automatiquement
    await startBackgroundTracking();
  };

  return <YourAppContent />;
}
```

### 2. Pendant une Course

```typescript
export default function ActiveRideScreen({ rideId }) {
  const { setCurrentRide } = useLocationTracking();

  useEffect(() => {
    // Associer la course au démarrage
    setCurrentRide(rideId);

    // Dissocier à la fin
    return () => {
      setCurrentRide(null);
    };
  }, [rideId]);

  return <RideContent />;
}
```

### 3. Changement de Statut

```typescript
export default function HomeScreen() {
  const {
    isBackgroundTracking,
    updateDriverStatus,
    toggleBackgroundTracking,
  } = useLocationTracking();

  const toggleAvailability = async (available: boolean) => {
    await updateDriverStatus(isBackgroundTracking, available);
  };

  return (
    <View>
      <Switch
        value={isBackgroundTracking}
        onValueChange={async (value) => {
          await updateDriverStatus(value, value);
          await toggleBackgroundTracking();
        }}
      />
    </View>
  );
}
```

## Différences avec votre Code Original

### Similitudes
- Structure identique avec Context + Provider
- API similaire (startTracking, stopTracking, etc.)
- Utilisation de TaskManager et expo-location
- Gestion des permissions
- AsyncStorage pour les données locales

### Améliorations
- ✅ Intégration Supabase automatique
- ✅ Sauvegarde dans `location_history` table
- ✅ Mise à jour automatique de la position du driver
- ✅ Enregistrement du niveau de batterie
- ✅ RLS pour la sécurité
- ✅ Gestion automatique des erreurs
- ✅ Pas besoin d'un serveur backend séparé
- ✅ TypeScript complet

### Ce qui est enregistré dans Supabase

Chaque position GPS sauvegarde:
```typescript
{
  driver_id: "user-uuid",
  vehicle_id: "vehicle-uuid",
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 10.5,
  altitude: 35.0,
  speed: 12.5,
  heading: 90.0,
  is_online: true,
  is_available: true,
  ride_id: "ride-uuid", // null si pas de course
  battery_level: 85,
  created_at: "2024-12-09T10:30:00Z"
}
```

## Avantages de cette Approche

1. **Simplicité**: Pas besoin de gérer un serveur backend
2. **Sécurité**: RLS activé, chaque driver voit uniquement ses données
3. **Temps réel**: Supabase Realtime disponible si besoin
4. **Historique**: 30 jours d'historique automatique
5. **Analyses**: Facile de créer des rapports et statistiques
6. **Traçabilité**: Chaque course a son trajet complet

## Migration depuis votre Code

Si vous avez déjà du code avec LocationContext:

1. Remplacer l'import:
```typescript
// Avant
import { useLocation } from '@/contexts/YourOldLocationContext';

// Après
import { useLocationTracking } from '@/contexts/LocationContext';
```

2. Mettre à jour l'API si nécessaire (les noms sont similaires)

3. Le reste fonctionne de la même manière!

## Prochaines Étapes

1. Ajouter les permissions dans `app.json`
2. Wrapper votre app avec `LocationProvider`
3. Utiliser `useLocationTracking()` dans vos composants
4. Tester sur appareil physique

Tout est prêt! 🚀
