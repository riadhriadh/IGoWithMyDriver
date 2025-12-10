# Guide de Création de l'Application Passager

## 🎯 Vue d'ensemble

Ce guide décrit comment créer l'application passager qui fonctionne avec l'application chauffeur existante. L'app passager permet aux utilisateurs de commander des courses, suivre leur chauffeur en temps réel, et gérer leur historique.

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Base de données](#base-de-données)
3. [Authentification](#authentification)
4. [Écrans principaux](#écrans-principaux)
5. [Fonctionnalités clés](#fonctionnalités-clés)
6. [Intégration temps réel](#intégration-temps-réel)
7. [Paiements](#paiements)
8. [Notifications](#notifications)
9. [Roadmap d'implémentation](#roadmap-dimplémentation)

---

## Architecture

### Structure de l'App

```
passenger-app/
├── contexts/
│   ├── AuthContext.tsx          (Authentification passager)
│   ├── RideContext.tsx          (Gestion des courses)
│   └── MapContext.tsx           (Carte et géolocalisation)
│
├── services/
│   ├── rideService.ts           (API courses)
│   ├── driverTrackingService.ts (Suivi chauffeur)
│   ├── paymentService.ts        (Paiements)
│   └── geocodingService.ts      (Adresses)
│
├── components/
│   ├── map/
│   │   ├── PassengerMap.tsx     (Carte interactive)
│   │   ├── DriverMarker.tsx     (Marqueur chauffeur)
│   │   └── RoutePolyline.tsx    (Trajet)
│   ├── ride/
│   │   ├── RideRequestForm.tsx  (Formulaire réservation)
│   │   ├── DriverCard.tsx       (Info chauffeur)
│   │   └── RideStatus.tsx       (Statut course)
│   └── payment/
│       ├── PaymentMethod.tsx    (Méthode paiement)
│       └── RideCostEstimate.tsx (Estimation prix)
│
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx             (Accueil - Réserver)
│   │   ├── rides.tsx            (Mes courses)
│   │   └── profile.tsx          (Profil)
│   ├── ride/
│   │   ├── request.tsx          (Demander une course)
│   │   ├── [id].tsx             (Détails course)
│   │   └── tracking.tsx         (Suivi en temps réel)
│   └── payment/
│       ├── methods.tsx          (Méthodes paiement)
│       └── add-card.tsx         (Ajouter carte)
```

### Technologies

- **React Native + Expo** (même stack que l'app driver)
- **Supabase** (base de données partagée)
- **expo-location** (GPS passager)
- **react-native-maps** (carte interactive)
- **Stripe** (paiements - optionnel)
- **Supabase Realtime** (suivi temps réel)

---

## Base de données

### Nouvelles Tables

#### 1. Table `passengers`

```sql
CREATE TABLE passengers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  avatar_url text,
  default_payment_method text,
  rating_average numeric DEFAULT 5.0,
  total_rides integer DEFAULT 0,
  favorite_addresses jsonb DEFAULT '[]'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view own data"
  ON passengers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Passengers can update own data"
  ON passengers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

#### 2. Mettre à jour la table `rides`

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE rides ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS dropoff_address text;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS estimated_price numeric;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS final_price numeric;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS passenger_rating integer;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_rating integer;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS passenger_comment text;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_comment text;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_by text;

-- Index pour les requêtes passager
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_passenger_status ON rides(passenger_id, status);
```

#### 3. Table `ride_requests`

```sql
CREATE TABLE ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid REFERENCES passengers(id) NOT NULL,
  pickup_latitude numeric NOT NULL,
  pickup_longitude numeric NOT NULL,
  pickup_address text NOT NULL,
  dropoff_latitude numeric NOT NULL,
  dropoff_longitude numeric NOT NULL,
  dropoff_address text NOT NULL,
  estimated_distance numeric,
  estimated_duration integer,
  estimated_price numeric,
  vehicle_type text DEFAULT 'standard',
  payment_method text,
  notes text,
  status text DEFAULT 'searching', -- searching, accepted, cancelled, expired
  accepted_by uuid REFERENCES drivers(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view own requests"
  ON ride_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view pending requests"
  ON ride_requests FOR SELECT
  TO authenticated
  USING (
    status = 'searching'
    AND expires_at > now()
  );

CREATE POLICY "Passengers can insert own requests"
  ON ride_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);
```

#### 4. Table `favorite_places`

```sql
CREATE TABLE favorite_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid REFERENCES passengers(id) NOT NULL,
  name text NOT NULL, -- "Maison", "Travail", etc.
  address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  icon text DEFAULT 'map-pin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorite_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can manage own favorite places"
  ON favorite_places
  TO authenticated
  USING (auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = passenger_id);
```

#### 5. Table `ratings`

```sql
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) NOT NULL,
  passenger_id uuid REFERENCES passengers(id),
  driver_id uuid REFERENCES drivers(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  rated_by text NOT NULL, -- 'passenger' ou 'driver'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings for their rides"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = passenger_id OR
    auth.uid() = driver_id
  );

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    (rated_by = 'passenger' AND auth.uid() = passenger_id) OR
    (rated_by = 'driver' AND auth.uid() = driver_id)
  );
```

### Fonctions Utiles

#### Fonction: Rechercher des chauffeurs disponibles

```sql
CREATE OR REPLACE FUNCTION find_available_drivers(
  p_latitude numeric,
  p_longitude numeric,
  p_radius_km numeric DEFAULT 5,
  p_vehicle_type text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  driver_name text,
  driver_rating numeric,
  vehicle_type text,
  latitude numeric,
  longitude numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    (
      6371 * acos(
        cos(radians(p_latitude))
        * cos(radians(d.current_latitude))
        * cos(radians(d.current_longitude) - radians(p_longitude))
        + sin(radians(p_latitude))
        * sin(radians(d.current_latitude))
      )
    ) as distance,
    d.full_name,
    d.rating_average,
    v.type,
    d.current_latitude,
    d.current_longitude
  FROM drivers d
  JOIN vehicles v ON v.driver_id = d.id AND v.is_active = true
  WHERE
    d.is_online = true
    AND d.is_available = true
    AND d.current_latitude IS NOT NULL
    AND d.current_longitude IS NOT NULL
    AND (p_vehicle_type IS NULL OR v.type = p_vehicle_type)
  HAVING (
    6371 * acos(
      cos(radians(p_latitude))
      * cos(radians(d.current_latitude))
      * cos(radians(d.current_longitude) - radians(p_longitude))
      + sin(radians(p_latitude))
      * sin(radians(d.current_latitude))
    )
  ) < p_radius_km
  ORDER BY distance
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
```

#### Fonction: Calculer le prix estimé

```sql
CREATE OR REPLACE FUNCTION calculate_ride_price(
  p_distance_km numeric,
  p_vehicle_type text DEFAULT 'standard'
)
RETURNS numeric AS $$
DECLARE
  base_fare numeric := 2.50;
  per_km_rate numeric;
  min_fare numeric := 5.00;
  calculated_price numeric;
BEGIN
  -- Tarifs par type de véhicule
  per_km_rate := CASE p_vehicle_type
    WHEN 'economy' THEN 1.00
    WHEN 'standard' THEN 1.50
    WHEN 'premium' THEN 2.50
    WHEN 'van' THEN 2.00
    ELSE 1.50
  END;

  calculated_price := base_fare + (p_distance_km * per_km_rate);

  RETURN GREATEST(calculated_price, min_fare);
END;
$$ LANGUAGE plpgsql;
```

---

## Authentification

### Contexte Auth Passager

```typescript
// contexts/PassengerAuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface Passenger {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  rating_average: number;
  total_rides: number;
}

interface PassengerAuthContextType {
  session: Session | null;
  passenger: Passenger | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Passenger>) => Promise<void>;
}

const PassengerAuthContext = createContext<PassengerAuthContextType | undefined>(undefined);

export const PassengerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadPassengerProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadPassengerProfile(session.user.id);
      } else {
        setPassenger(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPassengerProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPassenger(data);
    } catch (error) {
      console.error('Error loading passenger profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('passengers')
        .insert([{
          id: data.user.id,
          email,
          full_name: fullName,
        }]);

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<Passenger>) => {
    if (!passenger) return;

    const { error } = await supabase
      .from('passengers')
      .update(updates)
      .eq('id', passenger.id);

    if (error) throw error;
    setPassenger({ ...passenger, ...updates });
  };

  return (
    <PassengerAuthContext.Provider value={{
      session,
      passenger,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </PassengerAuthContext.Provider>
  );
};

export const usePassengerAuth = () => {
  const context = useContext(PassengerAuthContext);
  if (!context) {
    throw new Error('usePassengerAuth must be used within PassengerAuthProvider');
  }
  return context;
};
```

---

## Écrans principaux

### 1. Écran d'accueil (Réservation)

**Fichier:** `app/(tabs)/home.tsx`

**Fonctionnalités:**
- Carte interactive avec position du passager
- Champ de recherche pour départ et arrivée
- Boutons pour lieux favoris
- Sélection du type de véhicule
- Estimation du prix
- Bouton "Réserver une course"

**État:**
```typescript
const [pickupLocation, setPickupLocation] = useState(null);
const [dropoffLocation, setDropoffLocation] = useState(null);
const [vehicleType, setVehicleType] = useState('standard');
const [estimatedPrice, setEstimatedPrice] = useState(null);
const [availableDrivers, setAvailableDrivers] = useState([]);
```

### 2. Écran de recherche de chauffeur

**Fichier:** `app/ride/searching.tsx`

**Fonctionnalités:**
- Animation de recherche
- Liste des chauffeurs proches
- Timeout (ex: 2 minutes)
- Option d'annulation
- Notification quand chauffeur trouvé

### 3. Écran de suivi en temps réel

**Fichier:** `app/ride/tracking.tsx`

**Fonctionnalités:**
- Carte avec position chauffeur en temps réel
- ETA (temps d'arrivée estimé)
- Trajet prévu
- Info chauffeur (photo, nom, véhicule, note)
- Bouton d'appel
- Bouton d'annulation
- Chat (optionnel)

### 4. Écran d'historique

**Fichier:** `app/(tabs)/rides.tsx`

**Fonctionnalités:**
- Liste des courses passées
- Filtres (date, statut)
- Détails de chaque course
- Option de réserver la même course
- Option de noter le chauffeur

### 5. Écran de profil

**Fichier:** `app/(tabs)/profile.tsx`

**Fonctionnalités:**
- Info utilisateur
- Moyens de paiement
- Lieux favoris
- Paramètres
- Historique
- Support

---

## Fonctionnalités clés

### 1. Réservation de course

```typescript
// services/rideService.ts

interface RideRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffAddress: string;
  vehicleType: string;
  paymentMethod: string;
  notes?: string;
}

export async function requestRide(request: RideRequest) {
  // 1. Calculer la distance et le prix
  const distance = calculateDistance(
    request.pickupLatitude,
    request.pickupLongitude,
    request.dropoffLatitude,
    request.dropoffLongitude
  );

  const { data: priceData } = await supabase
    .rpc('calculate_ride_price', {
      p_distance_km: distance,
      p_vehicle_type: request.vehicleType,
    });

  const estimatedPrice = priceData;

  // 2. Chercher des chauffeurs disponibles
  const { data: drivers } = await supabase
    .rpc('find_available_drivers', {
      p_latitude: request.pickupLatitude,
      p_longitude: request.pickupLongitude,
      p_radius_km: 10,
      p_vehicle_type: request.vehicleType,
    });

  if (!drivers || drivers.length === 0) {
    throw new Error('Aucun chauffeur disponible');
  }

  // 3. Créer la demande de course
  const { data: rideRequest, error } = await supabase
    .from('ride_requests')
    .insert([{
      passenger_id: (await supabase.auth.getUser()).data.user!.id,
      pickup_latitude: request.pickupLatitude,
      pickup_longitude: request.pickupLongitude,
      pickup_address: request.pickupAddress,
      dropoff_latitude: request.dropoffLatitude,
      dropoff_longitude: request.dropoffLongitude,
      dropoff_address: request.dropoffAddress,
      estimated_distance: distance,
      estimated_price: estimatedPrice,
      vehicle_type: request.vehicleType,
      payment_method: request.paymentMethod,
      notes: request.notes,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
    }])
    .select()
    .single();

  if (error) throw error;

  // 4. Notifier les chauffeurs proches
  await notifyNearbyDrivers(drivers.map(d => d.driver_id), rideRequest.id);

  return rideRequest;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### 2. Suivi du chauffeur en temps réel

```typescript
// services/driverTrackingService.ts

export function subscribeToDriverLocation(
  driverId: string,
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void
) {
  const channel = supabase
    .channel(`driver:${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
        filter: `id=eq.${driverId}`,
      },
      (payload) => {
        const driver = payload.new;
        if (driver.current_latitude && driver.current_longitude) {
          onLocationUpdate({
            latitude: driver.current_latitude,
            longitude: driver.current_longitude,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToRideStatus(
  rideId: string,
  onStatusChange: (status: string) => void
) {
  const channel = supabase
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
        onStatusChange(ride.status);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

### 3. Geocoding (Adresses)

```typescript
// services/geocodingService.ts

// Option 1: Google Maps Geocoding API (nécessite clé API)
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return data.results[0].formatted_address;
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

// Option 2: Nominatim (OpenStreetMap - gratuit)
export async function reverseGeocodeOSM(latitude: number, longitude: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YourAppName/1.0',
    },
  });
  const data = await response.json();

  return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

// Recherche d'adresse
export async function searchAddress(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YourAppName/1.0',
    },
  });

  return await response.json();
}
```

---

## Intégration temps réel

### Composant de suivi

```typescript
// components/ride/LiveRideTracking.tsx

import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { subscribeToDriverLocation } from '@/services/driverTrackingService';

interface Props {
  rideId: string;
  driverId: string;
  pickupLocation: { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
}

export default function LiveRideTracking({
  rideId,
  driverId,
  pickupLocation,
  dropoffLocation
}: Props) {
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToDriverLocation(driverId, (location) => {
      setDriverLocation(location);

      // Calculer l'ETA
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        pickupLocation.latitude,
        pickupLocation.longitude
      );

      // Vitesse moyenne 30 km/h en ville
      const etaMinutes = Math.ceil((distance / 30) * 60);
      setEta(etaMinutes);
    });

    return unsubscribe;
  }, [driverId]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Marqueur départ */}
        <Marker coordinate={pickupLocation} title="Départ" pinColor="green" />

        {/* Marqueur arrivée */}
        <Marker coordinate={dropoffLocation} title="Arrivée" pinColor="red" />

        {/* Marqueur chauffeur */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Chauffeur"
          >
            {/* Image personnalisée de voiture */}
          </Marker>
        )}

        {/* Trajet */}
        {driverLocation && (
          <Polyline
            coordinates={[driverLocation, pickupLocation, dropoffLocation]}
            strokeColor="#4F46E5"
            strokeWidth={3}
          />
        )}
      </MapView>

      {eta && (
        <View style={{ position: 'absolute', top: 20, left: 20, right: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              Arrivée dans {eta} min
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
```

---

## Paiements

### Intégration Stripe (Recommandé)

**Note:** Stripe ne supporte pas les paiements in-app Apple/Google. Pour les paiements mobiles, utilisez **RevenueCat** ou **Stripe Payment Links**.

```typescript
// services/paymentService.ts

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export async function savePaymentMethod(method: PaymentMethod) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Sauvegarder dans Supabase (référence Stripe)
  const { error } = await supabase
    .from('passengers')
    .update({
      default_payment_method: method.id,
    })
    .eq('id', user.id);

  if (error) throw error;
}

export async function processPayment(rideId: string, amount: number) {
  // Appeler votre Edge Function Supabase
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: {
      rideId,
      amount,
    },
  });

  if (error) throw error;
  return data;
}
```

### Edge Function pour paiement

```typescript
// supabase/functions/process-payment/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
});

serve(async (req) => {
  try {
    const { rideId, amount } = await req.json();

    // Créer un PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // En centimes
      currency: 'eur',
      metadata: {
        rideId,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Notifications

### Push Notifications

```typescript
// services/notificationService.ts

import * as Notifications from 'expo-notifications';

export async function setupNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    console.log('Permission refusée');
    return;
  }

  const token = await Notifications.getExpoPushTokenAsync();

  // Sauvegarder le token dans Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('passengers')
      .update({ push_token: token.data })
      .eq('id', user.id);
  }

  return token;
}

export async function sendNotification(
  passengerId: string,
  title: string,
  body: string,
  data?: any
) {
  // Récupérer le token du passager
  const { data: passenger } = await supabase
    .from('passengers')
    .select('push_token')
    .eq('id', passengerId)
    .single();

  if (!passenger?.push_token) return;

  // Envoyer via Expo
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: passenger.push_token,
      title,
      body,
      data,
    }),
  });
}
```

### Notifications importantes

1. **Chauffeur trouvé**
2. **Chauffeur en route**
3. **Chauffeur arrivé**
4. **Course commencée**
5. **Course terminée**
6. **Rappel de notation**

---

## Roadmap d'implémentation

### Phase 1: Setup de base (1 semaine)

- [ ] Créer le projet Expo
- [ ] Configurer Supabase
- [ ] Créer les tables (passengers, ride_requests, etc.)
- [ ] Implémenter l'authentification
- [ ] Configurer la navigation

### Phase 2: Réservation (2 semaines)

- [ ] Écran d'accueil avec carte
- [ ] Recherche d'adresses (geocoding)
- [ ] Sélection départ/arrivée
- [ ] Lieux favoris
- [ ] Estimation du prix
- [ ] Recherche de chauffeurs
- [ ] Création de course

### Phase 3: Suivi temps réel (1 semaine)

- [ ] Écran de suivi en temps réel
- [ ] Carte avec position chauffeur
- [ ] Abonnement Realtime Supabase
- [ ] Calcul ETA
- [ ] Info chauffeur
- [ ] Bouton d'appel

### Phase 4: Historique et profil (1 semaine)

- [ ] Écran historique des courses
- [ ] Détails de course
- [ ] Écran profil
- [ ] Modification profil
- [ ] Paramètres

### Phase 5: Paiements (1 semaine)

- [ ] Intégration Stripe
- [ ] Ajout de carte bancaire
- [ ] Moyens de paiement
- [ ] Traitement paiement
- [ ] Reçus

### Phase 6: Notifications (3 jours)

- [ ] Configuration push notifications
- [ ] Notifications pour chaque étape
- [ ] Gestion des permissions

### Phase 7: Évaluations (3 jours)

- [ ] Écran de notation
- [ ] Système de commentaires
- [ ] Affichage des notes

### Phase 8: Polish et tests (1 semaine)

- [ ] Tests sur iOS/Android
- [ ] Gestion des erreurs
- [ ] Loading states
- [ ] Animations
- [ ] Optimisations

---

## Composants clés à créer

### 1. LocationSearchInput

```typescript
// Composant de recherche d'adresse avec autocomplétion
<LocationSearchInput
  placeholder="Où allez-vous ?"
  onLocationSelect={(location) => setDropoff(location)}
/>
```

### 2. VehicleTypeSelector

```typescript
// Sélecteur de type de véhicule
<VehicleTypeSelector
  selected={vehicleType}
  onSelect={setVehicleType}
  estimatedPrices={{
    economy: 8.50,
    standard: 12.00,
    premium: 18.50,
  }}
/>
```

### 3. DriverCard

```typescript
// Carte d'info du chauffeur
<DriverCard
  driver={driver}
  vehicle={vehicle}
  eta={5}
  onCall={() => callDriver(driver.phone)}
/>
```

### 4. RideStatusTimeline

```typescript
// Timeline du statut de la course
<RideStatusTimeline
  status={ride.status}
  timestamps={{
    requested: ride.requested_at,
    accepted: ride.accepted_at,
    started: ride.started_at,
    completed: ride.completed_at,
  }}
/>
```

---

## Intégration avec l'App Driver

### Communication Driver ↔ Passenger

**Via Supabase Realtime:**

1. **Passager crée une demande** → Table `ride_requests`
2. **Chauffeurs disponibles reçoivent notification** → Realtime
3. **Chauffeur accepte** → Mise à jour `ride_requests.accepted_by`
4. **Course créée** → Table `rides`
5. **Positions chauffeur en temps réel** → Table `location_history`
6. **Changements de statut** → Realtime sur table `rides`

### Événements temps réel

```typescript
// Côté passager - Écouter l'acceptation
supabase
  .channel('ride-request')
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
        navigateToTracking(payload.new.id);
      }
    }
  )
  .subscribe();
```

---

## Conseils de développement

### 1. Commencez simple

- Implémentez d'abord le flux de base sans paiement
- Utilisez des prix fixes pour commencer
- Testez sur un seul type de véhicule

### 2. Testez en duo

- Installez l'app driver et passenger sur 2 appareils
- Testez le flux complet en conditions réelles
- Vérifiez les performances du temps réel

### 3. Gérez les cas limites

- Aucun chauffeur disponible
- Chauffeur annule
- Passager annule
- Perte de connexion
- GPS désactivé

### 4. Optimisez la carte

- Utilisez `react-native-maps` natif
- Limitez les markers
- Optimisez les polylines
- Gérez le zoom automatique

### 5. Performance Supabase

- Créez des index sur les colonnes fréquemment requêtées
- Utilisez les RPC functions pour les calculs
- Limitez les subscriptions Realtime actives

---

## Ressources

### Documentation
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Stripe Mobile](https://stripe.com/docs/mobile)

### APIs Utiles
- Google Maps Platform (geocoding, directions)
- OpenStreetMap Nominatim (gratuit)
- Mapbox (alternative)

---

## Prochaines étapes

1. **Créer le projet passenger app**
2. **Implémenter les migrations Supabase**
3. **Créer l'authentification**
4. **Développer l'écran de réservation**
5. **Implémenter le temps réel**
6. **Tester avec l'app driver existante**

Bonne chance pour la création de l'app passager! 🚀
