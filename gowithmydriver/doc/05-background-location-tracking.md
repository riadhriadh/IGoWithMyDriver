# Background Location Tracking - Guide Complet

## Vue d'ensemble

Le système de tracking GPS en arrière-plan permet de suivre la position des chauffeurs en temps réel, même lorsque l'application est en arrière-plan ou fermée. Les données sont automatiquement sauvegardées dans Supabase avec les informations du chauffeur et du véhicule.

## Architecture

```
┌─────────────────────┐
│  React Native App   │
│                     │
│  useBackgroundTracking()
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Background Service  │
│                     │
│ - expo-task-manager │
│ - expo-location     │
│ - expo-battery      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Supabase DB       │
│                     │
│ - location_history  │
│ - drivers (update)  │
└─────────────────────┘
```

## Table de Données

### location_history

Stocke toutes les positions GPS avec contexte:

```sql
- id (uuid)
- driver_id (uuid) - Référence au chauffeur
- vehicle_id (uuid) - Véhicule actif
- latitude (numeric)
- longitude (numeric)
- accuracy (numeric) - Précision en mètres
- altitude (numeric)
- speed (numeric) - Vitesse en m/s
- heading (numeric) - Direction 0-360°
- is_online (boolean) - Statut en ligne
- is_available (boolean) - Disponibilité
- ride_id (uuid) - Course en cours (si applicable)
- battery_level (numeric) - Niveau de batterie 0-100
- created_at (timestamptz)
```

## Installation

```bash
npm install expo-task-manager expo-battery
```

Les dépendances sont déjà ajoutées au `package.json`.

## Permissions Requises

### app.json

Ajouter les permissions dans `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "L'application a besoin de votre position pour suivre vos courses.",
          "locationAlwaysPermission": "L'application a besoin de votre position en arrière-plan pour suivre vos courses.",
          "locationWhenInUsePermission": "L'application a besoin de votre position pour afficher les courses à proximité.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": "L'application a besoin de votre position pour suivre vos courses.",
        "NSLocationWhenInUseUsageDescription": "L'application a besoin de votre position pour afficher les courses à proximité.",
        "UIBackgroundModes": ["location"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    }
  }
}
```

## Utilisation

### 1. Configuration Initiale

Dans votre composant principal ou dans `_layout.tsx`:

```typescript
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Sauvegarder les données du driver pour le background task
      AsyncStorage.setItem('@driver_data', JSON.stringify({
        id: user.id,
        email: user.email,
      }));
    }
  }, [user]);

  return <YourApp />;
}
```

### 2. Utiliser le Hook dans un Composant

```typescript
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

export default function TrackingScreen() {
  const {
    isTracking,
    hasPermission,
    loading,
    error,
    startTracking,
    stopTracking,
    toggleTracking,
    requestPermissions,
  } = useBackgroundTracking(false, {
    accuracy: Location.Accuracy.High,
    timeInterval: 30000, // 30 secondes
    distanceInterval: 50, // 50 mètres
    showsBackgroundLocationIndicator: true,
  });

  if (loading) {
    return <Text>Chargement...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracking GPS</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.status}>
        Statut: {isTracking ? 'Actif' : 'Inactif'}
      </Text>

      <Text style={styles.status}>
        Permission: {hasPermission ? 'Accordée' : 'Non accordée'}
      </Text>

      {!hasPermission && (
        <Button
          title="Demander les permissions"
          onPress={requestPermissions}
        />
      )}

      <Button
        title={isTracking ? 'Arrêter le tracking' : 'Démarrer le tracking'}
        onPress={toggleTracking}
        disabled={!hasPermission}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});
```

### 3. Associer une Course au Tracking

Quand le chauffeur démarre une course:

```typescript
import { backgroundLocationService } from '@/services/backgroundLocationService';

// Quand la course commence
const startRide = async (rideId: string) => {
  await backgroundLocationService.setCurrentRide(rideId);

  // Les positions suivantes seront associées à cette course
};

// Quand la course se termine
const endRide = async () => {
  await backgroundLocationService.setCurrentRide(null);
};
```

### 4. Mettre à Jour le Statut du Chauffeur

```typescript
import { backgroundLocationService } from '@/services/backgroundLocationService';

// Quand le chauffeur se met en ligne
const goOnline = async () => {
  await backgroundLocationService.updateDriverStatus(true, true);
};

// Quand le chauffeur se met hors ligne
const goOffline = async () => {
  await backgroundLocationService.updateDriverStatus(false, false);
};
```

### 5. Sauvegarder le Véhicule Actif

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const setActiveVehicle = async (vehicle: any) => {
  await AsyncStorage.setItem('@active_vehicle', JSON.stringify(vehicle));
};
```

## API du Service

### backgroundLocationService

#### startTracking(options?)

Démarre le tracking en arrière-plan.

```typescript
const started = await backgroundLocationService.startTracking({
  accuracy: Location.Accuracy.High,
  timeInterval: 30000, // millisecondes
  distanceInterval: 50, // mètres
  deferredUpdatesInterval: 60000,
  showsBackgroundLocationIndicator: true,
});
```

#### stopTracking()

Arrête le tracking.

```typescript
await backgroundLocationService.stopTracking();
```

#### isTracking()

Vérifie si le tracking est actif.

```typescript
const isActive = await backgroundLocationService.isTracking();
```

#### requestPermissions()

Demande les permissions de localisation.

```typescript
const granted = await backgroundLocationService.requestPermissions();
```

#### setCurrentRide(rideId)

Associe une course au tracking.

```typescript
await backgroundLocationService.setCurrentRide('ride-uuid');
```

#### updateDriverStatus(isOnline, isAvailable)

Met à jour le statut du chauffeur.

```typescript
await backgroundLocationService.updateDriverStatus(true, true);
```

#### getLocationHistory(driverId, options)

Récupère l'historique des positions.

```typescript
const history = await backgroundLocationService.getLocationHistory(driverId, {
  limit: 100,
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  rideId: 'ride-uuid',
});
```

#### getLastLocation(driverId)

Récupère la dernière position connue.

```typescript
const lastLocation = await backgroundLocationService.getLastLocation(driverId);
```

#### getRideLocationHistory(rideId)

Récupère toutes les positions pour une course.

```typescript
const rideLocations = await backgroundLocationService.getRideLocationHistory(rideId);
```

## Configuration Recommandée

### Haute Précision (Course en cours)

```typescript
{
  accuracy: Location.Accuracy.High,
  timeInterval: 10000, // 10 secondes
  distanceInterval: 25, // 25 mètres
}
```

### Précision Normale (En attente)

```typescript
{
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 30000, // 30 secondes
  distanceInterval: 50, // 50 mètres
}
```

### Économie d'Énergie (Veille)

```typescript
{
  accuracy: Location.Accuracy.Low,
  timeInterval: 60000, // 1 minute
  distanceInterval: 100, // 100 mètres
}
```

## Afficher le Trajet d'une Course

```typescript
import { useEffect, useState } from 'react';
import MapView, { Polyline } from 'react-native-maps';
import { backgroundLocationService } from '@/services/backgroundLocationService';

function RideMap({ rideId }: { rideId: string }) {
  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    loadRideTrack();
  }, [rideId]);

  const loadRideTrack = async () => {
    const locations = await backgroundLocationService.getRideLocationHistory(rideId);

    if (locations) {
      const coords = locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));

      setCoordinates(coords);
    }
  };

  return (
    <MapView style={{ flex: 1 }}>
      <Polyline
        coordinates={coordinates}
        strokeColor="#4F46E5"
        strokeWidth={4}
      />
    </MapView>
  );
}
```

## Nettoyage des Anciennes Données

Les données de plus de 30 jours sont automatiquement supprimées avec la fonction SQL `cleanup_old_locations()`.

Pour exécuter manuellement:

```typescript
await backgroundLocationService.cleanupOldLocations();
```

## Tests

### Test sur iOS Simulator

Le tracking en arrière-plan ne fonctionne pas complètement sur le simulateur iOS. Utilisez un appareil physique pour tester.

### Test sur Android Emulator

Sur Android Emulator, vous pouvez simuler des positions GPS via:
- Android Studio > Extended Controls > Location
- Ou via adb: `adb emu geo fix <longitude> <latitude>`

### Test en Production

Sur un appareil réel:
1. Accorder toutes les permissions
2. Démarrer le tracking
3. Fermer l'application
4. Se déplacer physiquement
5. Vérifier les données dans Supabase

## Optimisations

### Batterie

- Ajuster `timeInterval` et `distanceInterval` selon le contexte
- Utiliser `Location.Accuracy.Balanced` quand possible
- Arrêter le tracking quand le chauffeur est hors ligne

### Données

- Les anciennes positions (>30 jours) sont supprimées automatiquement
- Seules les positions significatives sont sauvegardées (distance minimale)
- Compression possible côté serveur

### Performance

- Les positions sont sauvegardées en batch quand possible
- Index optimisés sur la table `location_history`
- Requêtes limitées avec `limit` et dates

## Dépannage

### Le tracking ne démarre pas

- Vérifier les permissions (foreground + background)
- Vérifier que `@driver_data` est dans AsyncStorage
- Vérifier les logs pour les erreurs

### Les positions ne sont pas sauvegardées

- Vérifier la connexion Supabase
- Vérifier les politiques RLS
- Vérifier que le driver_id existe dans la table drivers

### La batterie se vide rapidement

- Augmenter `timeInterval` et `distanceInterval`
- Réduire `accuracy` à `Balanced` ou `Low`
- Arrêter le tracking quand non nécessaire

## Sécurité

- Les données de localisation sont protégées par RLS
- Seul le chauffeur peut voir son propre historique
- Les positions ne sont jamais partagées sans consentement
- Chiffrement en transit (HTTPS) et au repos

## Support Android/iOS

### Android

- Requiert API level 21+ (Android 5.0+)
- Foreground service avec notification obligatoire
- Permission background location requise

### iOS

- Requiert iOS 13+
- Indicateur bleu en haut de l'écran quand actif
- Permission "Toujours autoriser" requise

## Ressources

- [expo-location documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [expo-task-manager documentation](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security)
