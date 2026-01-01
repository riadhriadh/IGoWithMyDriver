# Intégration avec le Backend API

Ce guide explique comment l'application driver consomme les API du backend NestJS.

## 📋 Table des matières

- [Configuration](#configuration)
- [Architecture](#architecture)
- [Services disponibles](#services-disponibles)
- [Utilisation](#utilisation)
- [Migration depuis Supabase](#migration-depuis-supabase)

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet gowithmydriver :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Pour tester sur un appareil physique, utilisez l'IP de votre machine :
```env
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api/v1
```

### 2. Démarrer le backend

Assurez-vous que le backend est en cours d'exécution :

```bash
cd ../backend
npm run start:dev
```

## Architecture

### Structure des fichiers

```
gowithmydriver/
├── lib/
│   ├── api.config.ts       # Configuration des endpoints
│   ├── apiClient.ts        # Client HTTP avec gestion des tokens
│   └── supabase.ts         # Client Supabase (optionnel)
├── services/
│   ├── authService.ts      # Service d'authentification
│   ├── rideService.ts      # Service des courses
│   ├── driverService.ts    # Service chauffeur
│   └── locationService.ts  # Service de localisation
└── contexts/
    └── AuthContext.tsx     # Context React pour l'auth
```

### Flux d'authentification

```
┌─────────────┐
│   Login     │
│   Screen    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  authService    │─────►│  API Client  │
│  .login()       │      │  + Token     │
└─────────────────┘      └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │   Backend    │
                          │   NestJS     │
                          └──────────────┘
```

## Services disponibles

### 1. AuthService

```typescript
import { authService } from '@/services/authService';

// Login
const response = await authService.login({
  email: 'driver@example.com',
  password: 'password123'
});

// Register
const response = await authService.register({
  email: 'driver@example.com',
  password: 'password123',
  fullName: 'John Doe',
  phone: '+33612345678'
});

// Logout
await authService.logout();

// Get profile
const profile = await authService.getProfile();
```

### 2. RideService

```typescript
import { rideService } from '@/services/rideService';

// Get available rides
const rides = await rideService.getAvailableRides({
  latitude: 48.8566,
  longitude: 2.3522
});

// Get active ride
const activeRide = await rideService.getActiveRide();

// Accept ride
const ride = await rideService.acceptRide('ride-id', {
  estimatedArrivalTime: 5
});

// Start ride
await rideService.startRide('ride-id');

// Complete ride
await rideService.completeRide('ride-id', {
  finalPrice: 25.50,
  actualDistance: 5.2,
  actualDuration: 15
});

// Cancel ride
await rideService.cancelRide('ride-id', {
  reason: 'Traffic',
  cancelledBy: 'driver'
});
```

### 3. DriverService

```typescript
import { driverService } from '@/services/driverService';

// Update status
await driverService.updateStatus('available');

// Update location
await driverService.updateLocation({
  latitude: 48.8566,
  longitude: 2.3522,
  heading: 90,
  speed: 30
});

// Get earnings
const earnings = await driverService.getEarnings();
// { today: 150, week: 800, month: 3200, total: 15000 }

// Get stats
const stats = await driverService.getStats();
// { totalRides: 500, rating: 4.8, ... }
```

## Utilisation

### Exemple avec AuthContext

```typescript
// contexts/AuthContextBackend.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, DriverProfile } from '@/services/authService';

interface AuthContextType {
  user: DriverProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const profile = await authService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user.driver!);
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const response = await authService.register({
      email,
      password,
      fullName,
      phone,
    });
    setUser(response.user.driver!);
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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

### Exemple dans un écran de login

```typescript
// app/auth/login.tsx
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContextBackend';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button
        title={loading ? 'Loading...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### Exemple de liste de courses

```typescript
// app/(tabs)/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { rideService, Ride } from '@/services/rideService';

export default function HomeScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const availableRides = await rideService.getAvailableRides();
      setRides(availableRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      await rideService.acceptRide(rideId);
      loadRides(); // Refresh list
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  return (
    <View>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1 }}>
            <Text>{item.pickupLocation.address}</Text>
            <Text>{item.dropoffLocation.address}</Text>
            <Text>${item.estimatedPrice}</Text>
            <Button
              title="Accept"
              onPress={() => handleAcceptRide(item.id)}
            />
          </View>
        )}
        refreshing={loading}
        onRefresh={loadRides}
      />
    </View>
  );
}
```

## Migration depuis Supabase

### Option 1 : Remplacement complet

Remplacez tous les appels Supabase par les services backend :

1. **AuthContext** : Utilisez `authService` au lieu de `supabase.auth`
2. **Rides** : Utilisez `rideService` au lieu de requêtes Supabase
3. **Profile** : Utilisez `driverService` au lieu de requêtes Supabase

### Option 2 : Approche hybride

Gardez Supabase pour certaines fonctionnalités (real-time, storage) et utilisez le backend pour le reste :

```typescript
// Supabase pour real-time updates
supabase
  .channel('rides')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'rides' 
  }, (payload) => {
    // New ride available
  })
  .subscribe();

// Backend pour les opérations CRUD
const rides = await rideService.getAvailableRides();
await rideService.acceptRide(rideId);
```

## Gestion des erreurs

Le client API gère automatiquement :

- ✅ Refresh automatique des tokens expirés
- ✅ File d'attente des requêtes pendant le refresh
- ✅ Formatage des erreurs de l'API
- ✅ Gestion des erreurs réseau

```typescript
try {
  await rideService.acceptRide(rideId);
} catch (error) {
  if (error.statusCode === 409) {
    alert('This ride has already been accepted');
  } else if (error.statusCode === 401) {
    // Token expired, will auto-refresh and retry
  } else {
    alert(error.message);
  }
}
```

## Tests

Pour tester avec le backend local sur un appareil physique :

1. Trouvez votre IP locale :
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Mettez à jour `.env` :
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api/v1
   ```

3. Assurez-vous que le backend accepte les connexions de votre réseau local

## WebSocket pour le real-time

Pour les mises à jour en temps réel (nouvelles courses, localisation), vous pouvez :

1. Utiliser Supabase Real-time (solution actuelle)
2. Implémenter Socket.IO avec le backend
3. Utiliser Server-Sent Events (SSE)

Exemple avec Socket.IO (à implémenter) :

```typescript
import io from 'socket.io-client';

const socket = io(API_CONFIG.baseURL, {
  auth: {
    token: await apiClient.getAccessToken()
  }
});

socket.on('new-ride', (ride) => {
  console.log('New ride available:', ride);
});
```

## Prochaines étapes

1. ✅ Services créés (auth, rides, driver)
2. ⏳ Créer un AuthContext utilisant le backend
3. ⏳ Mettre à jour les écrans pour utiliser les nouveaux services
4. ⏳ Implémenter les WebSockets pour le real-time
5. ⏳ Ajouter la gestion du cache (React Query)
6. ⏳ Tests end-to-end

## Support

Pour toute question, consultez :
- Backend API : `http://localhost:3000/api/v1` (voir Swagger docs)
- Documentation backend : `/backend/docs/`

