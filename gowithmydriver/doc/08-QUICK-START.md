# Quick Start - Tracking GPS avec LocationContext

## 🚀 Démarrage Rapide

Le `LocationContext` est déjà configuré dans votre application! Voici comment l'utiliser.

## ✅ Ce qui est déjà fait

1. **LocationProvider** est ajouté dans `app/_layout.tsx`
2. **Table Supabase** `location_history` est créée
3. **Composants UI** sont prêts à l'emploi
4. **Dépendances** sont installées

## 📱 Utilisation Simple

### Option 1: Utiliser le Composant UI

Dans n'importe quel écran:

```typescript
import TrackingControlContext from '@/components/TrackingControlContext';

export default function MyScreen() {
  return (
    <View>
      <TrackingControlContext />
    </View>
  );
}
```

C'est tout! Le composant gère tout automatiquement.

### Option 2: Utiliser le Hook

Pour plus de contrôle:

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';

export default function MyScreen() {
  const { isBackgroundTracking, toggleBackgroundTracking } = useLocationTracking();

  return (
    <Button
      title={isBackgroundTracking ? "Arrêter" : "Démarrer"}
      onPress={toggleBackgroundTracking}
    />
  );
}
```

## 🎯 Cas d'Usage Principaux

### 1. Toggle Simple du Tracking

```typescript
const { toggleBackgroundTracking } = useLocationTracking();

<Button title="Toggle Tracking" onPress={toggleBackgroundTracking} />
```

### 2. Démarrer une Course

```typescript
const { setCurrentRide } = useLocationTracking();

const startRide = async (rideId: string) => {
  await setCurrentRide(rideId);
  // Toutes les positions seront maintenant associées à cette course
};
```

### 3. Terminer une Course

```typescript
const { setCurrentRide } = useLocationTracking();

const endRide = async () => {
  await setCurrentRide(null);
  // Les positions ne seront plus associées à une course
};
```

### 4. Changer le Statut

```typescript
const { updateDriverStatus } = useLocationTracking();

// Se mettre en ligne et disponible
await updateDriverStatus(true, true);

// Se mettre hors ligne
await updateDriverStatus(false, false);
```

### 5. Sélectionner un Véhicule

```typescript
const { setActiveVehicle } = useLocationTracking();

await setActiveVehicle('vehicle-uuid-123');
```

## 📍 Écran de Test

Un écran complet de test est disponible:

```
app/tracking/index.tsx
```

Pour y accéder, ajoutez-le à votre navigation ou visitez `/tracking`.

## 🔧 Configuration Permissions

Dans votre `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "L'application a besoin de votre position pour suivre vos courses.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ],
    "ios": {
      "infoPlist": {
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

## 🗂️ Structure des Données

Chaque position enregistre automatiquement dans Supabase:

```typescript
{
  driver_id: "uuid",
  vehicle_id: "uuid",
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 10.5,
  speed: 12.5,
  heading: 90.0,
  is_online: true,
  is_available: true,
  ride_id: "uuid", // null si pas de course
  battery_level: 85,
  created_at: "timestamp"
}
```

## 📊 API Complète du Hook

```typescript
const {
  // État
  location,              // Position GPS actuelle
  isTracking,           // Tracking actif (foreground)
  isBackgroundTracking, // Tracking arrière-plan actif
  error,                // Message d'erreur

  // Actions
  startTracking,              // Démarrer tracking foreground
  stopTracking,               // Arrêter tout tracking
  startBackgroundTracking,    // Démarrer tracking background
  stopBackgroundTracking,     // Arrêter tracking background
  toggleBackgroundTracking,   // Basculer tracking

  // Configuration
  setCurrentRide,       // Associer une course
  updateDriverStatus,   // Mettre à jour le statut
  setActiveVehicle,     // Sélectionner un véhicule
} = useLocationTracking();
```

## 🎨 Exemple Complet

```typescript
import { useLocationTracking } from '@/contexts/LocationContext';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function DriverScreen() {
  const {
    location,
    isBackgroundTracking,
    toggleBackgroundTracking,
    setCurrentRide,
    updateDriverStatus,
  } = useLocationTracking();

  const goOnline = async () => {
    await updateDriverStatus(true, true);
    await toggleBackgroundTracking();
  };

  const acceptRide = async (rideId: string) => {
    await setCurrentRide(rideId);
    await updateDriverStatus(true, false);
  };

  return (
    <View style={styles.container}>
      <Text>Status: {isBackgroundTracking ? 'En ligne' : 'Hors ligne'}</Text>

      {location && (
        <Text>
          Position: {location.coords.latitude.toFixed(4)},
          {location.coords.longitude.toFixed(4)}
        </Text>
      )}

      <Button
        title={isBackgroundTracking ? "Se mettre hors ligne" : "Se mettre en ligne"}
        onPress={goOnline}
      />

      <Button
        title="Accepter une course"
        onPress={() => acceptRide('ride-123')}
        disabled={!isBackgroundTracking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
```

## 🔍 Vérifier les Données

Dans Supabase:

```sql
-- Voir les dernières positions
SELECT * FROM location_history
ORDER BY created_at DESC
LIMIT 10;

-- Voir le trajet d'une course
SELECT * FROM location_history
WHERE ride_id = 'votre-ride-id'
ORDER BY created_at ASC;

-- Voir la dernière position d'un driver
SELECT * FROM location_history
WHERE driver_id = 'votre-driver-id'
ORDER BY created_at DESC
LIMIT 1;
```

## ⚠️ Important

1. **Tester sur un appareil réel** - Le tracking en arrière-plan ne fonctionne pas sur simulateur iOS
2. **Accorder toutes les permissions** - Surtout "Toujours autoriser" pour le background
3. **Fermer l'app** - Pour tester vraiment le background tracking
4. **Se déplacer** - Le tracking ne s'active qu'après un déplacement minimum

## 🆘 Dépannage

### Le tracking ne démarre pas
- Vérifier les permissions dans les paramètres du téléphone
- Redémarrer l'application
- Vérifier les logs pour les erreurs

### Les positions ne sont pas enregistrées
- Vérifier que vous êtes connecté (session Supabase)
- Vérifier les policies RLS dans Supabase
- Vérifier que le driver_id existe dans la table drivers

### Consommation batterie élevée
- Augmenter `timeInterval` à 60000 (1 minute)
- Augmenter `distanceInterval` à 100 (100 mètres)
- Utiliser `Location.Accuracy.Balanced` au lieu de `High`

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `doc/05-background-location-tracking.md` - Guide technique complet
- `doc/06-BACKGROUND-TRACKING-SUMMARY.md` - Résumé et exemples
- `doc/07-LOCATION-CONTEXT-USAGE.md` - API détaillée du Context

## ✨ Avantages

✅ **Simple**: 3 lignes de code pour activer le tracking
✅ **Automatique**: Sauvegarde dans Supabase automatiquement
✅ **Sécurisé**: RLS activé, données chiffrées
✅ **Complet**: Inclut driver, véhicule, course, batterie
✅ **Performant**: Optimisé pour la batterie
✅ **Fiable**: Fonctionne même app fermée

Prêt à utiliser! 🚀
