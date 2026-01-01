/**
 * Location Context - Backend API version (no Supabase)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationObject } from 'expo-location';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/api.config';
import { backgroundLocationService, LocationHistoryEntry } from '@/services/backgroundLocationService';

const LOCATION_TRACKING = 'background-location-task';

interface LocationContextType {
  location: LocationObject | null;
  isTracking: boolean;
  isBackgroundTracking: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  startBackgroundTracking: () => Promise<void>;
  stopBackgroundTracking: () => Promise<void>;
  toggleBackgroundTracking: () => Promise<void>;
  setCurrentRide: (rideId: string | null) => Promise<void>;
  updateDriverStatus: (isOnline: boolean, isAvailable: boolean) => Promise<void>;
  setActiveVehicle: (vehicleId: string | null) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      AsyncStorage.setItem('@driver_data', JSON.stringify({
        id: user.id,
        email: user.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    checkTrackingStatus();
  }, []);

  const checkTrackingStatus = async () => {
    if (Platform.OS === 'web') return;

    try {
      const tasks = await TaskManager.getRegisteredTasksAsync();
      const isTaskRunning = tasks.some(task => task.taskName === LOCATION_TRACKING);

      if (isTaskRunning) {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
        setIsBackgroundTracking(hasStarted);
        setIsTracking(hasStarted);
      }
    } catch (err) {
      console.error('Error checking tracking status:', err);
    }
  };

  const updateLocation = useCallback(async (newLocation: LocationObject) => {
    setLocation(newLocation);
    await AsyncStorage.setItem('@last_location', JSON.stringify(newLocation.coords));

    if (!user) return;

    try {
      const driverData = await AsyncStorage.getItem('@driver_data');
      const vehicleData = await AsyncStorage.getItem('@active_vehicle');
      const currentRideId = await AsyncStorage.getItem('@current_ride_id');
      const driverStatus = await AsyncStorage.getItem('@driver_status');

      if (!driverData) return;

      const driver = JSON.parse(driverData);
      const vehicle = vehicleData ? JSON.parse(vehicleData) : null;
      const status = driverStatus ? JSON.parse(driverStatus) : { is_online: true, is_available: false };

      let batteryLevel: number | null = null;
      try {
        if (Platform.OS !== 'web') {
          batteryLevel = await Battery.getBatteryLevelAsync();
          batteryLevel = Math.round(batteryLevel * 100);
        }
      } catch (e) {
        console.log('Could not get battery level:', e);
      }

      // Send location to backend API
      try {
        await apiClient.post(API_ENDPOINTS.LOCATION.UPDATE, {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          accuracy: newLocation.coords.accuracy || null,
          altitude: newLocation.coords.altitude || null,
          speed: newLocation.coords.speed || null,
          heading: newLocation.coords.heading || null,
          isOnline: status.is_online ?? true,
          isAvailable: status.is_available ?? false,
          rideId: currentRideId || null,
          vehicleId: vehicle?.id || null,
          batteryLevel,
        });
      } catch (apiError) {
        console.error('Error saving location to API:', apiError);
      }
    } catch (err) {
      console.error('Error processing location:', err);
    }
  }, [user]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const setupLocationTracking = async () => {
      if (isTracking && Platform.OS !== 'web' && !isBackgroundTracking) {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') {
          setError('Permission de localisation refusée');
          return;
        }

        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          await updateLocation(currentLocation);

          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 10000,
              distanceInterval: 10,
            },
            async (newLocation) => {
              await updateLocation(newLocation);
            }
          );
        } catch (err) {
          console.error('Error setting up location tracking:', err);
          setError('Erreur lors du tracking');
        }
      }
    };

    setupLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTracking, isBackgroundTracking, updateLocation]);

  const startTracking = async () => {
    if (Platform.OS === 'web') {
      setIsTracking(true);
      return;
    }

    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de la permission de localisation pour fonctionner.'
        );
        return;
      }

      setIsTracking(true);
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError('Erreur lors du démarrage du tracking');
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
    if (isBackgroundTracking) {
      await stopBackgroundTracking();
    }
  };

  const startBackgroundTracking = async () => {
    if (Platform.OS === 'web') {
      setIsBackgroundTracking(true);
      return;
    }

    try {
      setError(null);

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        setError('Permission de localisation refusée');
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de la permission de localisation.'
        );
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        setError('Permission de localisation en arrière-plan refusée');
        Alert.alert(
          'Permission arrière-plan requise',
          'Pour suivre votre position en arrière-plan, veuillez autoriser l\'accès "Toujours autoriser" dans les paramètres.'
        );
        return;
      }

      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TRACKING);
      if (!isTaskDefined) {
        throw new Error('Background location task is not defined');
      }

      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);

      if (isRunning) {
        console.log('Background tracking already running');
        setIsBackgroundTracking(true);
        setIsTracking(true);
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000,
        distanceInterval: 50,
        deferredUpdatesInterval: 60000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Tracking actif',
          notificationBody: 'Votre position est suivie pour les courses',
          notificationColor: '#4F46E5',
        },
      });

      await AsyncStorage.setItem('@tracking_enabled', 'true');
      setIsBackgroundTracking(true);
      setIsTracking(true);

      Alert.alert(
        'Tracking démarré',
        'Le tracking GPS en arrière-plan est maintenant actif.'
      );
    } catch (err) {
      console.error('Error starting background tracking:', err);
      setError('Erreur lors du démarrage du tracking en arrière-plan');
      Alert.alert(
        'Erreur',
        'Impossible de démarrer le tracking en arrière-plan.'
      );
    }
  };

  const stopBackgroundTracking = async () => {
    if (Platform.OS === 'web') {
      setIsBackgroundTracking(false);
      return;
    }

    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);

      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }

      await AsyncStorage.setItem('@tracking_enabled', 'false');
      setIsBackgroundTracking(false);
      setIsTracking(false);

      Alert.alert(
        'Tracking arrêté',
        'Le tracking GPS a été arrêté.'
      );
    } catch (err) {
      console.error('Error stopping background tracking:', err);
      setError('Erreur lors de l\'arrêt du tracking');
    }
  };

  const toggleBackgroundTracking = async () => {
    if (isBackgroundTracking) {
      await stopBackgroundTracking();
    } else {
      await startBackgroundTracking();
    }
  };

  const setCurrentRide = async (rideId: string | null) => {
    if (rideId) {
      await AsyncStorage.setItem('@current_ride_id', rideId);
    } else {
      await AsyncStorage.removeItem('@current_ride_id');
    }
  };

  const updateDriverStatus = async (isOnline: boolean, isAvailable: boolean) => {
    await AsyncStorage.setItem(
      '@driver_status',
      JSON.stringify({ is_online: isOnline, is_available: isAvailable })
    );
    await AsyncStorage.setItem('@isAvailable', isAvailable.toString());
    
    // Update status on backend
    try {
      await apiClient.patch(API_ENDPOINTS.DRIVERS.UPDATE_STATUS, {
        status: isOnline ? (isAvailable ? 'available' : 'busy') : 'offline',
      });
    } catch (err) {
      console.error('Error updating driver status on backend:', err);
    }
  };

  const setActiveVehicle = async (vehicleId: string | null) => {
    if (vehicleId) {
      // Get vehicle from backend
      try {
        const response = await apiClient.get<{ vehicle: any }>(`/drivers/vehicles/${vehicleId}`);
        if (response.vehicle) {
          await AsyncStorage.setItem('@active_vehicle', JSON.stringify(response.vehicle));
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err);
      }
    } else {
      await AsyncStorage.removeItem('@active_vehicle');
    }
  };

  return (
    <LocationContext.Provider
      value={{
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
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationTracking = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationTracking must be used within a LocationProvider');
  }
  return context;
};
