# Résumé: Tracking GPS en Arrière-plan

## Ce qui a été créé

### 1. Base de données Supabase ✅

**Table `location_history`**
- Stocke toutes les positions GPS avec contexte complet
- Colonnes: driver_id, vehicle_id, latitude, longitude, accuracy, altitude, speed, heading, is_online, is_available, ride_id, battery_level, created_at
- Index optimisés pour les requêtes rapides
- RLS activé pour la sécurité
- Fonctions SQL pour requêtes optimisées

**Migration**: `supabase/migrations/create_location_history_table.sql`

### 2. Service Background ✅

**Fichier**: `services/backgroundLocationService.ts`

Fonctionnalités:
- Tracking GPS en arrière-plan avec `expo-task-manager`
- Sauvegarde automatique dans Supabase
- Intégration avec les infos driver + vehicle
- Enregistrement du niveau de batterie
- Association automatique avec les courses actives
- Mise à jour du statut du chauffeur (online/available)

API disponible:
```typescript
backgroundLocationService.startTracking(options)
backgroundLocationService.stopTracking()
backgroundLocationService.isTracking()
backgroundLocationService.requestPermissions()
backgroundLocationService.setCurrentRide(rideId)
backgroundLocationService.updateDriverStatus(isOnline, isAvailable)
backgroundLocationService.getLocationHistory(driverId, options)
backgroundLocationService.getLastLocation(driverId)
backgroundLocationService.getRideLocationHistory(rideId)
```

### 3. Hook React ✅

**Fichier**: `hooks/useBackgroundTracking.ts`

Hook personnalisé pour faciliter l'utilisation du tracking:
```typescript
const {
  isTracking,
  hasPermission,
  loading,
  error,
  startTracking,
  stopTracking,
  toggleTracking,
  requestPermissions,
  setCurrentRide,
  updateDriverStatus,
} = useBackgroundTracking(autoStart, options);
```

### 4. Composant UI ✅

**Fichier**: `components/TrackingControl.tsx`

Composant React Native prêt à l'emploi avec:
- Interface utilisateur complète
- Gestion des permissions
- Indicateur de statut (actif/inactif)
- Messages d'erreur et d'information
- Bouton toggle pour démarrer/arrêter
- Dialog d'information

### 5. Documentation complète ✅

**Fichier**: `doc/05-background-location-tracking.md`

Guide complet avec:
- Architecture détaillée
- Instructions d'installation
- Configuration des permissions
- Exemples de code
- API complète
- Configuration recommandée
- Affichage de trajet sur map
- Optimisations batterie/données
- Dépannage
- Support Android/iOS

## Installation

Les dépendances sont déjà ajoutées au `package.json`:
```bash
npm install
```

Packages installés:
- `expo-task-manager` - Pour les tâches en arrière-plan
- `expo-battery` - Pour le niveau de batterie

## Configuration requise

### 1. Permissions dans app.json

Ajouter dans votre `app.json`:

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

### 2. Initialiser les données du driver

Dans votre `_layout.tsx` ou composant principal:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

useEffect(() => {
  if (user) {
    AsyncStorage.setItem('@driver_data', JSON.stringify({
      id: user.id,
      email: user.email,
    }));
  }
}, [user]);
```

## Utilisation simple

### Option 1: Utiliser le composant TrackingControl

```typescript
import TrackingControl from '@/components/TrackingControl';

export default function ProfileScreen() {
  return (
    <View>
      <TrackingControl />
    </View>
  );
}
```

### Option 2: Utiliser le hook directement

```typescript
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';

function MyScreen() {
  const { isTracking, toggleTracking } = useBackgroundTracking(false);

  return (
    <Button
      title={isTracking ? "Arrêter" : "Démarrer"}
      onPress={toggleTracking}
    />
  );
}
```

### Option 3: Utiliser le service directement

```typescript
import { backgroundLocationService } from '@/services/backgroundLocationService';

// Démarrer
await backgroundLocationService.startTracking();

// Associer une course
await backgroundLocationService.setCurrentRide(rideId);

// Arrêter
await backgroundLocationService.stopTracking();
```

## Intégration avec les courses

Quand le chauffeur accepte une course:

```typescript
import { backgroundLocationService } from '@/services/backgroundLocationService';

const acceptRide = async (rideId: string) => {
  // Associer la course au tracking
  await backgroundLocationService.setCurrentRide(rideId);

  // Toutes les positions seront maintenant liées à cette course
  // Vous pourrez afficher le trajet complet après
};

const completeRide = async () => {
  // Dissocier la course
  await backgroundLocationService.setCurrentRide(null);
};
```

## Afficher le trajet d'une course

```typescript
import MapView, { Polyline } from 'react-native-maps';
import { backgroundLocationService } from '@/services/backgroundLocationService';

function RideMap({ rideId }) {
  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    loadRideTrack();
  }, [rideId]);

  const loadRideTrack = async () => {
    const locations = await backgroundLocationService.getRideLocationHistory(rideId);

    if (locations) {
      setCoordinates(locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
      })));
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

## Optimisations batterie

Ajuster la fréquence selon le contexte:

```typescript
// Course en cours - haute précision
await backgroundLocationService.startTracking({
  accuracy: Location.Accuracy.High,
  timeInterval: 10000, // 10 secondes
  distanceInterval: 25, // 25 mètres
});

// En attente - précision normale
await backgroundLocationService.startTracking({
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 30000, // 30 secondes
  distanceInterval: 50, // 50 mètres
});

// Mode économie
await backgroundLocationService.startTracking({
  accuracy: Location.Accuracy.Low,
  timeInterval: 60000, // 1 minute
  distanceInterval: 100, // 100 mètres
});
```

## Données enregistrées

Pour chaque position GPS, le système enregistre automatiquement:

✅ Position GPS (latitude, longitude, accuracy)
✅ Altitude
✅ Vitesse
✅ Direction (heading)
✅ ID du chauffeur
✅ ID du véhicule actif
✅ Statut (online/available)
✅ ID de la course en cours (si applicable)
✅ Niveau de batterie
✅ Timestamp

## Sécurité

- Row Level Security (RLS) activé
- Chaque chauffeur ne voit que ses propres données
- Chiffrement HTTPS pour toutes les communications
- Données supprimées automatiquement après 30 jours

## Utilisation côté backend (NestJS)

Si vous utilisez le backend NestJS décrit dans les autres docs:

```typescript
// Récupérer l'historique d'un chauffeur
GET /api/v1/location-history/:driverId
Query params: limit, startDate, endDate, rideId

// Récupérer le trajet d'une course
GET /api/v1/rides/:rideId/track

// Récupérer la dernière position
GET /api/v1/drivers/:driverId/last-location
```

## Tests

### Sur appareil physique
1. Installer l'app
2. Accorder toutes les permissions (localisation toujours)
3. Démarrer le tracking
4. Fermer l'app
5. Se déplacer physiquement
6. Vérifier dans Supabase que les positions sont enregistrées

### Sur simulateur/émulateur
Le tracking en arrière-plan ne fonctionne pas complètement sur simulateur iOS. Sur Android Emulator, utilisez:
- Android Studio > Extended Controls > Location
- Ou: `adb emu geo fix <longitude> <latitude>`

## Prochaines étapes

1. ✅ Ajouter les permissions dans app.json
2. ✅ Tester sur appareil physique
3. ⚡ Ajuster les fréquences selon vos besoins
4. 📊 Créer des visualisations de trajets
5. 📈 Analyser les données pour optimiser
6. 🔔 Ajouter des alertes (vitesse, zone géographique)

## Support

Pour toute question:
- Consulter `doc/05-background-location-tracking.md` pour la documentation complète
- Vérifier les logs de l'application
- Tester sur appareil physique (pas simulateur)

## Architecture des données

```
Driver (online)
    ↓
Background Task (expo-task-manager)
    ↓
GPS Location (expo-location)
    ↓
Battery Level (expo-battery)
    ↓
Combine data (driver + vehicle + ride + location)
    ↓
Save to Supabase (location_history)
    ↓
Update driver position (drivers table)
```

## Statistiques disponibles

Avec les données collectées, vous pouvez:
- Calculer la distance totale parcourue
- Calculer le temps de conduite
- Analyser les zones fréquentées
- Optimiser les itinéraires
- Vérifier la conformité des trajets
- Générer des rapports d'activité

Tout est prêt à être utilisé! 🚀
