# Architecture Partagée - Driver & Passenger Apps

## 🎯 Vue d'ensemble

Les applications **Driver** et **Passenger** partagent la même base de données Supabase, permettant une communication en temps réel et une gestion centralisée des données.

## 🗄️ Base de données commune

### Tables partagées

```
Supabase Database
├── auth.users (Supabase Auth)
│
├── DRIVER TABLES
│   ├── drivers
│   ├── vehicles
│   ├── documents
│   ├── incidents
│   └── location_history
│
├── PASSENGER TABLES
│   ├── passengers
│   ├── ride_requests
│   ├── favorite_places
│   └── ratings
│
└── SHARED TABLES
    └── rides (utilisée par les deux apps)
```

### Distinction Driver vs Passenger

**Identification du type d'utilisateur:**

```sql
-- Un utilisateur est un driver si:
SELECT EXISTS(SELECT 1 FROM drivers WHERE id = auth.uid());

-- Un utilisateur est un passenger si:
SELECT EXISTS(SELECT 1 FROM passengers WHERE id = auth.uid());
```

**Important:** Un utilisateur peut être les deux (driver ET passenger) mais généralement on les sépare.

## 🔐 Configuration partagée

### Même fichier `.env`

Les deux apps utilisent les mêmes credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Même client Supabase

```typescript
// lib/supabase.ts (identique dans les 2 apps)
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## 🔄 Flux de communication

### 1. Réservation de course

```
PASSENGER APP                    SUPABASE                    DRIVER APP
     │                              │                             │
     │  1. Créer ride_request       │                             │
     ├──────────────────────────────>│                             │
     │                              │                             │
     │                              │  2. Notification via        │
     │                              │     Realtime                │
     │                              ├────────────────────────────>│
     │                              │                             │
     │                              │  3. Driver accepte          │
     │                              │<────────────────────────────┤
     │                              │                             │
     │  4. Notification acceptation │                             │
     │<─────────────────────────────┤                             │
     │                              │                             │
     │                              │  5. Créer ride              │
     │                              │<────────────────────────────┤
     │                              │                             │
```

### 2. Suivi en temps réel

```
DRIVER APP                       SUPABASE                    PASSENGER APP
     │                              │                             │
     │  Position GPS mise à jour    │                             │
     ├──────────────────────────────>│                             │
     │  (location_history + drivers) │                             │
     │                              │                             │
     │                              │  Position transmise         │
     │                              │  via Realtime               │
     │                              ├────────────────────────────>│
     │                              │                             │
     │                              │  Carte mise à jour          │
     │                              │                             │
```

### 3. Changement de statut

```
DRIVER APP                       SUPABASE                    PASSENGER APP
     │                              │                             │
     │  UPDATE rides                │                             │
     │  SET status = 'started'      │                             │
     ├──────────────────────────────>│                             │
     │                              │                             │
     │                              │  Notification Realtime      │
     │                              ├────────────────────────────>│
     │                              │                             │
     │                              │  UI mise à jour             │
     │                              │                             │
```

## 🛡️ Sécurité RLS

### Table `rides`

```sql
-- Les drivers peuvent voir leurs propres courses
CREATE POLICY "Drivers can view own rides"
  ON rides FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- Les passengers peuvent voir leurs propres courses
CREATE POLICY "Passengers can view own rides"
  ON rides FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

-- Les drivers peuvent modifier leurs courses
CREATE POLICY "Drivers can update own rides"
  ON rides FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);
```

### Table `ride_requests`

```sql
-- Passengers créent des demandes
CREATE POLICY "Passengers can create requests"
  ON ride_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

-- Drivers voient les demandes en attente
CREATE POLICY "Drivers can view pending requests"
  ON ride_requests FOR SELECT
  TO authenticated
  USING (
    status = 'searching'
    AND expires_at > now()
  );

-- Drivers peuvent accepter
CREATE POLICY "Drivers can accept requests"
  ON ride_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM drivers WHERE id = auth.uid())
  );
```

## 📡 Subscriptions Realtime

### App Driver: Écouter les nouvelles demandes

```typescript
// Driver App - Écouter ride_requests
const subscription = supabase
  .channel('ride-requests')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ride_requests',
      filter: `status=eq.searching`,
    },
    (payload) => {
      const request = payload.new;
      // Vérifier si le driver est proche
      const distance = calculateDistance(
        driverLocation,
        { lat: request.pickup_latitude, lng: request.pickup_longitude }
      );

      if (distance < 10) {
        // Afficher notification
        showRideRequestNotification(request);
      }
    }
  )
  .subscribe();
```

### App Passenger: Écouter l'acceptation

```typescript
// Passenger App - Écouter l'acceptation
const subscription = supabase
  .channel(`ride-request:${requestId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'ride_requests',
      filter: `id=eq.${requestId}`,
    },
    (payload) => {
      if (payload.new.status === 'accepted') {
        // Chauffeur trouvé!
        navigateToRideTracking(payload.new.accepted_by);
      }
    }
  )
  .subscribe();
```

### Les deux apps: Écouter les changements de course

```typescript
// Les deux apps - Suivre une course
const subscription = supabase
  .channel(`ride:${rideId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rides',
      filter: `id=eq.${rideId}`,
    },
    (payload) => {
      const ride = payload.new;
      // Mettre à jour l'UI selon le statut
      updateRideStatus(ride.status);
    }
  )
  .subscribe();
```

## 🔄 Cycle de vie d'une course

### États dans la base de données

```typescript
type RideStatus =
  | 'pending'           // Demande créée (ride_requests)
  | 'accepted'          // Driver a accepté
  | 'driver_arriving'   // Driver en route vers pickup
  | 'driver_arrived'    // Driver arrivé au pickup
  | 'in_progress'       // Course en cours
  | 'completed'         // Course terminée
  | 'cancelled';        // Course annulée
```

### Workflow complet

```
1. PASSENGER créer ride_request
   ↓
2. DRIVER voit notification
   ↓
3. DRIVER accepte → ride_request.status = 'accepted'
   ↓
4. DRIVER crée ride → rides table
   ↓
5. PASSENGER reçoit notification
   ↓
6. DRIVER démarre trajet → status = 'driver_arriving'
   ↓
7. DRIVER arrive au pickup → status = 'driver_arrived'
   ↓
8. PASSENGER monte → status = 'in_progress'
   ↓
9. DRIVER termine → status = 'completed'
   ↓
10. Les deux peuvent noter
```

## 📊 Données partagées

### Table `rides`

**Colonnes Driver:**
- `driver_id`
- `vehicle_type`
- `accepted_at`
- `started_at`
- `completed_at`
- `driver_rating`
- `driver_comment`

**Colonnes Passenger:**
- `passenger_id`
- `passenger_name`
- `passenger_phone`
- `passenger_rating`
- `passenger_comment`

**Colonnes communes:**
- `pickup_address`, `pickup_latitude`, `pickup_longitude`
- `destination_address`, `destination_latitude`, `destination_longitude`
- `status`
- `price`, `estimated_price`, `final_price`
- `payment_method`, `payment_status`

## 🎨 Structure de projet recommandée

### Option 1: Deux projets séparés

```
workspace/
├── driver-app/
│   ├── app/
│   ├── lib/
│   │   └── supabase.ts (même config)
│   └── .env (mêmes credentials)
│
├── passenger-app/
│   ├── app/
│   ├── lib/
│   │   └── supabase.ts (même config)
│   └── .env (mêmes credentials)
│
└── supabase/
    └── migrations/ (partagé)
```

### Option 2: Monorepo

```
ride-app/
├── apps/
│   ├── driver/
│   └── passenger/
│
├── packages/
│   ├── shared/
│   │   ├── lib/supabase.ts
│   │   ├── types/database.ts
│   │   └── utils/
│   └── ui/
│       └── components/
│
└── supabase/
    └── migrations/
```

## 🔧 Configuration actuelle

**App Driver (actuelle):**
- ✅ Tables drivers, vehicles, documents, incidents
- ✅ Location tracking
- ✅ Ride management
- ✅ Authentication

**App Passenger (à créer):**
- ✅ Tables passengers, ride_requests, favorite_places, ratings
- ✅ Ride booking
- ✅ Real-time tracking
- ✅ Authentication

**Base de données:**
- ✅ Supabase déjà configurée
- ✅ Toutes les tables créées
- ✅ RLS configurée
- ✅ Functions SQL créées

## 🚀 Démarrage rapide

### Pour l'app Driver (existante)

```bash
cd /tmp/cc-agent/61079420/project
npm run dev
```

### Pour créer l'app Passenger

```bash
# Dans un autre dossier
npx create-expo-app passenger-app --template blank-typescript
cd passenger-app

# Copier le même .env
cp ../project/.env .env

# Installer les dépendances
npm install @supabase/supabase-js @react-native-async-storage/async-storage
npm install react-native-maps expo-location expo-router

# Suivre le guide doc/10-PASSENGER-APP-QUICK-START.md
```

## 📞 Communication entre apps

### Via Supabase Realtime

Les deux apps communiquent via:
- ✅ Postgres Changes (INSERT, UPDATE, DELETE)
- ✅ Broadcast (messages directs)
- ✅ Presence (statut online/offline)

### Via Notifications Push

```typescript
// Driver accepte une course
await sendNotificationToPassenger(passengerId, {
  title: 'Chauffeur trouvé!',
  body: `${driver.name} arrive dans 5 minutes`,
});

// Passenger annule
await sendNotificationToDriver(driverId, {
  title: 'Course annulée',
  body: 'Le passager a annulé la course',
});
```

## 🎯 Avantages de cette architecture

1. **Une seule source de vérité** - Toutes les données dans Supabase
2. **Temps réel natif** - Pas besoin de polling
3. **Sécurité RLS** - Chaque utilisateur voit uniquement ses données
4. **Scalabilité** - Supabase gère la charge
5. **Facilité de développement** - Même API pour les deux apps
6. **Cohérence** - Les données sont toujours synchronisées

## ⚠️ Points d'attention

### Gestion des conflits

```typescript
// Éviter les race conditions
const { data, error } = await supabase
  .from('ride_requests')
  .update({ status: 'accepted', accepted_by: driverId })
  .eq('id', requestId)
  .eq('status', 'searching') // Condition atomique
  .select()
  .single();

if (!data) {
  // Un autre driver a déjà accepté
  alert('Course déjà prise');
}
```

### Gestion des expirations

```typescript
// Fonction à appeler périodiquement
const { data } = await supabase.rpc('expire_old_ride_requests');
```

### Gestion des déconnexions

```typescript
// Vérifier le statut online
const { data } = await supabase
  .from('drivers')
  .select('is_online')
  .eq('id', driverId)
  .single();

if (!data?.is_online) {
  // Driver hors ligne, notifier le passenger
}
```

## 📚 Ressources

- Guide complet Passenger: `doc/09-PASSENGER-APP-GUIDE.md`
- Quick Start Passenger: `doc/10-PASSENGER-APP-QUICK-START.md`
- Architecture Driver: `doc/01-architecture-overview.md`
- Supabase Realtime: https://supabase.com/docs/guides/realtime

---

**Conclusion:** Les deux apps utilisent la même base de données Supabase. Elles communiquent via Realtime et partagent la table `rides`. La sécurité est assurée par RLS qui filtre les données selon le type d'utilisateur (driver ou passenger).
