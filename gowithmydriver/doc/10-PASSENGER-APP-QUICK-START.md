# Passenger App - Quick Start

## 🚀 Démarrage Rapide

Guide express pour créer l'application passager en quelques étapes.

## ✅ Prérequis

- Application chauffeur fonctionnelle
- Base de données Supabase configurée
- Expo CLI installé

## 📦 Étape 1: Créer le Projet

```bash
# Créer un nouveau projet Expo
npx create-expo-app passenger-app --template blank-typescript

cd passenger-app

# Installer les dépendances
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
npm install react-native-maps
npm install expo-location
npm install expo-notifications
npm install expo-router
```

## 🗄️ Étape 2: Migrer la Base de Données

**Option A: Via Supabase Dashboard**
1. Aller dans SQL Editor
2. Copier le contenu de `supabase/migrations/20251209120000_create_passenger_tables.sql`
3. Exécuter

**Option B: Via CLI (si configuré)**
```bash
supabase db push
```

## 🔧 Étape 3: Configuration

### `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### `app.json`

```json
{
  "expo": {
    "name": "Passenger App",
    "slug": "passenger-app",
    "version": "1.0.0",
    "plugins": [
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Nous avons besoin de votre position pour vous trouver des chauffeurs.",
          "locationAlwaysPermission": "Permettez-nous d'accéder à votre position pour un meilleur service."
        }
      ]
    ],
    "ios": {
      "bundleIdentifier": "com.yourcompany.passengerapp",
      "infoPlist": {
        "UIBackgroundModes": []
      }
    },
    "android": {
      "package": "com.yourcompany.passengerapp",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

## 📁 Étape 4: Structure de Base

### Créer les dossiers

```bash
mkdir -p lib contexts services components/map components/ride
```

### Fichier: `lib/supabase.ts`

```typescript
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

## 🔐 Étape 5: Authentification

### Fichier: `contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Passenger {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
}

interface AuthContextType {
  passenger: Passenger | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadPassenger(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadPassenger(session.user.id);
        } else {
          setPassenger(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadPassenger = async (userId: string) => {
    const { data } = await supabase
      .from('passengers')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setPassenger(data);
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('passengers').insert([
        {
          id: data.user.id,
          email,
          full_name: fullName,
        },
      ]);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ passenger, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## 🗺️ Étape 6: Écran Principal avec Carte

### Fichier: `app/(tabs)/home.tsx`

```typescript
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setPickupLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const requestRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      alert('Sélectionnez départ et arrivée');
      return;
    }

    // TODO: Implémenter la logique de réservation
    alert('Recherche de chauffeurs...');
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView style={styles.map} initialRegion={location}>
          {pickupLocation && (
            <Marker
              coordinate={pickupLocation}
              title="Départ"
              pinColor="green"
            />
          )}
          {dropoffLocation && (
            <Marker
              coordinate={dropoffLocation}
              title="Arrivée"
              pinColor="red"
            />
          )}
        </MapView>
      )}

      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Où allez-vous ?</Text>

        <TouchableOpacity style={styles.input}>
          <Text>📍 Position actuelle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            // TODO: Ouvrir la recherche d'adresse
            setDropoffLocation({
              latitude: location.latitude + 0.01,
              longitude: location.longitude + 0.01,
            });
          }}
        >
          <Text>🔍 Où allez-vous ?</Text>
        </TouchableOpacity>

        {dropoffLocation && (
          <TouchableOpacity style={styles.button} onPress={requestRide}>
            <Text style={styles.buttonText}>Réserver</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## 🚗 Étape 7: Service de Réservation

### Fichier: `services/rideService.ts`

```typescript
import { supabase } from '@/lib/supabase';

interface RideRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffAddress: string;
  vehicleType?: string;
}

export async function requestRide(request: RideRequest) {
  // 1. Calculer la distance
  const distance = calculateDistance(
    request.pickupLatitude,
    request.pickupLongitude,
    request.dropoffLatitude,
    request.dropoffLongitude
  );

  // 2. Calculer le prix
  const { data: priceData } = await supabase.rpc('calculate_ride_price', {
    p_distance_km: distance,
    p_vehicle_type: request.vehicleType || 'standard',
  });

  // 3. Chercher des chauffeurs
  const { data: drivers } = await supabase.rpc('find_available_drivers', {
    p_latitude: request.pickupLatitude,
    p_longitude: request.pickupLongitude,
    p_radius_km: 10,
    p_vehicle_type: request.vehicleType,
  });

  if (!drivers || drivers.length === 0) {
    throw new Error('Aucun chauffeur disponible');
  }

  // 4. Créer la demande
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('ride_requests')
    .insert([
      {
        passenger_id: user!.id,
        pickup_latitude: request.pickupLatitude,
        pickup_longitude: request.pickupLongitude,
        pickup_address: request.pickupAddress,
        dropoff_latitude: request.dropoffLatitude,
        dropoff_longitude: request.dropoffLongitude,
        dropoff_address: request.dropoffAddress,
        estimated_distance: distance,
        estimated_price: priceData,
        vehicle_type: request.vehicleType || 'standard',
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return { request: data, nearbyDrivers: drivers };
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function subscribeToRideRequest(
  requestId: string,
  onAccepted: (rideId: string) => void
) {
  const channel = supabase
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
          onAccepted(payload.new.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

## 📱 Étape 8: Layout Principal

### Fichier: `app/_layout.tsx`

```typescript
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
      </Stack>
    </AuthProvider>
  );
}
```

### Fichier: `app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { Home, Clock, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Mes courses',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## 🚀 Étape 9: Lancer l'App

```bash
# Démarrer Expo
npx expo start

# Sur iOS
npx expo start --ios

# Sur Android
npx expo start --android
```

## ✅ Checklist de Base

- [ ] Projet créé
- [ ] Migration Supabase appliquée
- [ ] Configuration `.env`
- [ ] AuthContext créé
- [ ] Écran d'accueil avec carte
- [ ] Service de réservation
- [ ] Navigation configurée
- [ ] App lancée

## 🎯 Prochaines Étapes

1. **Ajouter la recherche d'adresses** (geocoding)
2. **Implémenter le suivi en temps réel**
3. **Créer l'écran d'historique**
4. **Ajouter les notifications**
5. **Implémenter les paiements**
6. **Système de notation**

## 📚 Ressources

- Guide complet: `doc/09-PASSENGER-APP-GUIDE.md`
- Migration SQL: `supabase/migrations/20251209120000_create_passenger_tables.sql`
- Expo Docs: https://docs.expo.dev
- Supabase Docs: https://supabase.com/docs

## 💡 Conseils

1. **Testez d'abord sur Web** pour un développement plus rapide
2. **Utilisez Expo Go** pour tester sur téléphone
3. **Testez avec l'app driver** en parallèle
4. **Commencez simple** puis ajoutez des fonctionnalités

Bon développement! 🚀
