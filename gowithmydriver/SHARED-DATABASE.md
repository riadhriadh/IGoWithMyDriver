# Configuration Base de Données Partagée

## 🎯 Vue d'ensemble

Les applications **Driver** (actuelle) et **Passenger** (à créer) utilisent **la même base de données Supabase**.

## ✅ Ce qui est déjà fait

### Base de données Supabase

Toutes les tables sont déjà créées dans la même base de données:

#### Tables Driver
- ✅ `drivers` - Profils chauffeurs
- ✅ `vehicles` - Véhicules
- ✅ `documents` - Documents administratifs
- ✅ `incidents` - Déclarations d'incidents
- ✅ `location_history` - Historique GPS

#### Tables Passenger (nouvellement ajoutées)
- ✅ `passengers` - Profils passagers
- ✅ `ride_requests` - Demandes de courses
- ✅ `favorite_places` - Lieux favoris
- ✅ `ratings` - Système de notation

#### Table partagée
- ✅ `rides` - Courses (utilisée par les deux apps)

### Fonctions SQL disponibles

```sql
-- Chercher des chauffeurs disponibles
SELECT * FROM find_available_drivers(
  p_latitude := 48.8566,
  p_longitude := 2.3522,
  p_radius_km := 10,
  p_vehicle_type := 'standard'
);

-- Calculer le prix d'une course
SELECT calculate_ride_price(
  p_distance_km := 5.5,
  p_vehicle_type := 'standard'
);
```

## 🔐 Configuration

### Fichier `.env`

Les deux apps utilisent les **mêmes credentials**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** Copie ce fichier `.env` dans l'app passenger quand tu la créeras.

## 🔄 Comment ça fonctionne

### 1. Passager réserve une course

```typescript
// Passenger App
const { data } = await supabase
  .from('ride_requests')
  .insert([{
    passenger_id: user.id,
    pickup_latitude: 48.8566,
    pickup_longitude: 2.3522,
    pickup_address: "Paris",
    dropoff_latitude: 48.8606,
    dropoff_longitude: 2.3376,
    dropoff_address: "Champs-Élysées",
    vehicle_type: 'standard'
  }]);
```

### 2. Driver reçoit notification en temps réel

```typescript
// Driver App
supabase
  .channel('ride-requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ride_requests'
  }, (payload) => {
    // Nouvelle demande!
    showNotification(payload.new);
  })
  .subscribe();
```

### 3. Driver accepte

```typescript
// Driver App
const { data } = await supabase
  .from('ride_requests')
  .update({
    status: 'accepted',
    accepted_by: driverId
  })
  .eq('id', requestId);

// Créer la course
await supabase.from('rides').insert([{
  driver_id: driverId,
  passenger_id: passengerId,
  status: 'accepted',
  // ...
}]);
```

### 4. Passager reçoit confirmation

```typescript
// Passenger App
supabase
  .channel(`ride-request:${requestId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'ride_requests'
  }, (payload) => {
    if (payload.new.status === 'accepted') {
      // Chauffeur trouvé!
    }
  })
  .subscribe();
```

## 🛡️ Sécurité

### Row Level Security (RLS)

Chaque utilisateur voit uniquement ses propres données:

```sql
-- Les drivers voient leurs courses
CREATE POLICY "Drivers can view own rides"
  ON rides FOR SELECT
  USING (auth.uid() = driver_id);

-- Les passengers voient leurs courses
CREATE POLICY "Passengers can view own rides"
  ON rides FOR SELECT
  USING (auth.uid() = passenger_id);
```

### Distinction Driver vs Passenger

Un utilisateur est identifié par:
- **Driver** si présent dans la table `drivers`
- **Passenger** si présent dans la table `passengers`

## 📁 Structure recommandée

### Option simple (recommandée)

```
workspace/
├── driver-app/           # App actuelle
│   ├── app/
│   ├── lib/supabase.ts
│   └── .env
│
└── passenger-app/        # Nouvelle app
    ├── app/
    ├── lib/supabase.ts   # Même config
    └── .env              # Mêmes credentials
```

### Créer l'app passenger

```bash
# Dans le dossier parent
cd ..

# Créer la nouvelle app
npx create-expo-app passenger-app --template blank-typescript
cd passenger-app

# Copier le .env
cp ../driver-app/.env .env

# Installer les dépendances
npm install @supabase/supabase-js @react-native-async-storage/async-storage
npm install react-native-maps expo-location expo-router
```

## 🔗 Tables communes

### Table `rides`

Cette table est utilisée par les **deux applications**:

**Colonnes pour Driver:**
- `driver_id` - ID du chauffeur
- `vehicle_type` - Type de véhicule
- `accepted_at` - Quand acceptée
- `started_at` - Quand démarrée
- `completed_at` - Quand terminée

**Colonnes pour Passenger:**
- `passenger_id` - ID du passager
- `passenger_name` - Nom
- `passenger_phone` - Téléphone

**Colonnes communes:**
- `pickup_address`, `pickup_latitude`, `pickup_longitude`
- `destination_address`, `destination_latitude`, `destination_longitude`
- `status` - État de la course
- `price` - Prix

## 🚀 Tester la communication

### Test 1: Driver crée une course

```typescript
// Dans l'app driver
const { data } = await supabase.from('rides').insert([{
  driver_id: driver.id,
  passenger_id: passenger.id,
  status: 'accepted',
  pickup_address: 'Paris',
  destination_address: 'Lyon'
}]);
```

### Test 2: Passenger voit la course

```typescript
// Dans l'app passenger
const { data } = await supabase
  .from('rides')
  .select('*')
  .eq('passenger_id', passenger.id);

console.log(data); // La course apparaît!
```

## 📊 Dashboard Supabase

Pour voir les données:

1. Aller sur https://supabase.com
2. Ouvrir ton projet
3. Aller dans **Table Editor**
4. Tu verras toutes les tables (drivers, passengers, rides, etc.)

## ⚡ Temps réel activé

Les deux apps peuvent écouter les changements en temps réel:

```typescript
// Écouter les changements sur rides
const subscription = supabase
  .channel('rides-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rides'
  }, (payload) => {
    console.log('Changement:', payload);
  })
  .subscribe();
```

## 📚 Documentation détaillée

- `doc/11-SHARED-SUPABASE-ARCHITECTURE.md` - Architecture complète
- `doc/09-PASSENGER-APP-GUIDE.md` - Guide app passenger
- `doc/10-PASSENGER-APP-QUICK-START.md` - Quick start passenger

## ✅ Checklist

- [x] Base de données Supabase configurée
- [x] Tables driver créées
- [x] Tables passenger créées
- [x] Table rides partagée
- [x] RLS configurée
- [x] Functions SQL créées
- [ ] App passenger à créer
- [ ] Tester la communication

---

**Les deux apps utilisent la même base de données Supabase!** 🎉
