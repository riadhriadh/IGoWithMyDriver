# Integration Guide - Intégration avec les Apps Frontend

## 🎯 Vue d'ensemble

Ce guide explique comment intégrer le backend NestJS avec vos applications frontend:
- **Driver App** (React Native)
- **Passenger App** (React Native)
- **Admin Dashboard** (Web - React/Next.js)

## 📡 Configuration du Client

### Base URL et Configuration

**Driver App** (`apps/driver/src/config/api.ts`)
```typescript
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

**Passenger App** (`apps/passenger/src/config/api.ts`)
```typescript
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

**Admin Web** (`apps/admin/src/config/api.ts`)
```typescript
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

### Client HTTP Wrapper

Créer un service réutilisable:

**React Native (Axios)**
```typescript
// apps/driver/src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@config/api';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

// Interceptor pour ajouter le token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour renouveler le token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@refresh_token');
        const response = await apiClient.post('/auth/refresh', {
          refreshToken,
        });

        await AsyncStorage.setItem('@auth_token', response.data.accessToken);
        await AsyncStorage.setItem('@refresh_token', response.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

**Web (Fetch ou Axios)**
```typescript
// apps/admin/src/services/api.ts
import axios from 'axios';
import { API_CONFIG } from '@config/api';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

// Similar interceptors as above
```

## 🔐 Authentification

### Flux Auth Complet

```typescript
// 1. Inscription
async function register(userData: RegisterData) {
  const response = await apiClient.post('/auth/register', {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    password: userData.password,
    userType: userData.userType || 'driver',
  });

  const { user, accessToken, refreshToken } = response.data;

  // Sauvegarder les tokens
  await AsyncStorage.setItem('@auth_token', accessToken);
  await AsyncStorage.setItem('@refresh_token', refreshToken);
  await AsyncStorage.setItem('@user', JSON.stringify(user));

  return user;
}

// 2. Login
async function login(email: string, password: string) {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  const { user, accessToken, refreshToken } = response.data;

  await AsyncStorage.setItem('@auth_token', accessToken);
  await AsyncStorage.setItem('@refresh_token', refreshToken);
  await AsyncStorage.setItem('@user', JSON.stringify(user));

  return user;
}

// 3. Logout
async function logout() {
  await apiClient.post('/auth/logout');
  
  await AsyncStorage.removeItem('@auth_token');
  await AsyncStorage.removeItem('@refresh_token');
  await AsyncStorage.removeItem('@user');
}

// 4. Récupérer le profil
async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}
```

### Context Auth (React/React Native)

```typescript
// apps/driver/src/contexts/AuthContext.tsx
import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@services/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'driver' | 'passenger' | 'admin';
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  register: (data: RegisterData) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurer la session au démarrage
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const userJson = await AsyncStorage.getItem('@user');
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = useCallback(async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    const { user, accessToken, refreshToken } = response.data;

    await AsyncStorage.setItem('@auth_token', accessToken);
    await AsyncStorage.setItem('@refresh_token', refreshToken);
    await AsyncStorage.setItem('@user', JSON.stringify(user));

    setUser(user);
    return user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data;

    await AsyncStorage.setItem('@auth_token', accessToken);
    await AsyncStorage.setItem('@refresh_token', refreshToken);
    await AsyncStorage.setItem('@user', JSON.stringify(user));

    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@refresh_token');
      await AsyncStorage.removeItem('@user');
      setUser(null);
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    const response = await apiClient.get('/auth/me');
    setUser(response.data);
    await AsyncStorage.setItem('@user', JSON.stringify(response.data));
    return response.data;
  }, []);

  const value = {
    user,
    isLoading,
    isSignedIn: !!user,
    register,
    login,
    logout,
    getCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 🚗 Drivers App - Integration

### Profile Chauffeur

```typescript
// Driver Profile Screen
import { useAuth } from '@contexts/AuthContext';
import apiClient from '@services/api';

export function DriverProfileScreen() {
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverProfile();
  }, []);

  const loadDriverProfile = async () => {
    try {
      const response = await apiClient.get('/drivers/profile');
      setDriver(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const response = await apiClient.patch('/drivers/profile', updates);
      setDriver(response.data);
      showSuccessAlert('Profile updated');
    } catch (error) {
      showErrorAlert('Failed to update profile');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View>
      <Text>Name: {driver?.userId?.firstName}</Text>
      <Text>Rating: {driver?.rating} ⭐</Text>
      <Text>Total Rides: {driver?.totalRides}</Text>
      {/* ... */}
    </View>
  );
}
```

### Nearby Drivers

```typescript
// Finding nearby drivers when passenger creates a ride
const response = await apiClient.get('/drivers/nearby', {
  params: {
    latitude: pickupLat,
    longitude: pickupLng,
  },
});

const nearbyDrivers = response.data;
```

### Update Location

```typescript
// Background location tracking
import * as Location from 'expo-location';
import apiClient from '@services/api';

export async function updateDriverLocation(driverId: string) {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  await apiClient.patch(`/drivers/${driverId}/location`, {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });
}

// Send to server periodically (e.g., every 30 seconds)
setInterval(async () => {
  await updateDriverLocation(driver._id);
}, 30000);
```

## 👥 Passengers App - Integration

### Create Ride

```typescript
// Passenger creates a ride
async function createRide(rideData: {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  estimatedFare: number;
}) {
  const response = await apiClient.post('/rides', {
    passengerId: user._id,
    ...rideData,
  });

  return response.data;
}
```

### Watch Driver Location (WebSocket)

```typescript
// apps/passenger/src/hooks/useRideTracking.ts
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useRideTracking(rideId: string) {
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3000/rides');

    socket.emit('join-ride', { rideId });

    socket.on('driver-location-updated', (data) => {
      setDriverLocation(data);
    });

    socket.on('ride-updated', (data) => {
      console.log('Ride updated:', data);
    });

    return () => {
      socket.emit('leave-ride', { rideId });
      socket.disconnect();
    };
  }, [rideId]);

  return { driverLocation };
}
```

### Rate Driver

```typescript
async function rateRide(rideId: string, rating: number, comment: string) {
  const response = await apiClient.post('/ratings', {
    rideId,
    driverId,
    rating,
    comment,
    ratedBy: 'passenger',
  });

  return response.data;
}
```

## 🖥️ Admin Dashboard - Integration

### Dashboard Stats

```typescript
// Admin Dashboard
import { useEffect, useState } from 'react';
import apiClient from '@services/api';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div>
      <Card title="Total Users">
        <h2>{stats?.totalUsers}</h2>
      </Card>
      <Card title="Total Drivers">
        <h2>{stats?.totalDrivers}</h2>
      </Card>
      <Card title="Total Passengers">
        <h2>{stats?.totalPassengers}</h2>
      </Card>
    </div>
  );
}
```

### Manage Users

```typescript
// User Management Table
const [users, setUsers] = useState([]);

async function loadUsers(userType?: string) {
  const response = await apiClient.get('/admin/users', {
    params: { userType, skip: 0, limit: 50 },
  });
  setUsers(response.data);
}

// Usage
useEffect(() => {
  loadUsers('driver'); // Load all drivers
}, []);
```

## 🔌 WebSocket - Real-time Features

### Location Tracking (Driver → Passenger)

```typescript
// Driver Side
import { io } from 'socket.io-client';

const locationSocket = io('http://localhost:3000/location');

locationSocket.emit('register-driver', { driverId: driver._id });

// Send location every 10 seconds
setInterval(() => {
  locationSocket.emit('location-update', {
    driverId: driver._id,
    latitude: currentLat,
    longitude: currentLng,
    accuracy: coords.accuracy,
  });
}, 10000);
```

```typescript
// Passenger Side
const locationSocket = io('http://localhost:3000/location');

locationSocket.on('location-updated', (data) => {
  // Update map with driver position
  updateMapMarker(data.latitude, data.longitude);
});
```

### Ride Updates (Driver ↔ Passenger)

```typescript
// Server envoie les mises à jour
// Client reçoit
const rideSocket = io('http://localhost:3000/rides');

rideSocket.on('ride-updated', (data) => {
  // data = { rideId, status, driverId, ... }
  updateRideUI(data);
});
```

## ✅ Checklist Intégration

### Frontend Setup
- [ ] Créer `API_CONFIG` avec baseURL
- [ ] Implémenter `apiClient` avec interceptors
- [ ] Créer `AuthContext` et `useAuth` hook
- [ ] Ajouter `AuthProvider` dans root layout
- [ ] Implémenter navigation conditionnelle (login/home)

### Driver App
- [ ] Écran login/register
- [ ] Écran profil chauffeur
- [ ] Écran statut (available/busy)
- [ ] Tracking GPS en arrière-plan
- [ ] Accepter/Refuser une course
- [ ] Navigation vers passager
- [ ] Historique des courses

### Passenger App
- [ ] Écran login/register
- [ ] Écran création de course
- [ ] Écran attente (trouver chauffeur)
- [ ] Écran course active avec map
- [ ] Tracker position chauffeur (WebSocket)
- [ ] Écran rating du chauffeur
- [ ] Historique des courses

### Admin Dashboard
- [ ] Page login
- [ ] Dashboard avec statistiques
- [ ] Tableau des utilisateurs
- [ ] Tableau des courses
- [ ] Gestion des chauffeurs
- [ ] Gestion des passagers
- [ ] Rapports et analytics

## 🐛 Debugging

### Network Inspector

```typescript
// Log all requests
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config.method?.toUpperCase(), config.url);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);
```

### WebSocket Debug

```typescript
const socket = io('http://localhost:3000/rides', {
  transports: ['websocket'],
  debug: true, // Enable debug logging
});

socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (err) => console.error('Socket error:', err));
```

## 📞 Support

Problèmes d'intégration? Vérifier:
1. API Running: `http://localhost:3000/api/v1/health`
2. CORS: Vérifier `CORS_ORIGIN` dans `.env`
3. WebSocket: Vérifier connexion dans Network tab
4. Tokens: Vérifier format dans headers
5. Logs: Voir `docker-compose logs -f api`

---

**Next**: Lire [ARCHITECTURE.md](../ARCHITECTURE.md) pour comprendre tous les endpoints
