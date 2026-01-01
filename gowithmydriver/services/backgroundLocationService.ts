/**
 * Background Location Service - Backend API version (no Supabase)
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/api.config';

const LOCATION_TASK_NAME = 'background-location-task';
const STORAGE_KEY_TRACKING = '@tracking_enabled';
const STORAGE_KEY_CURRENT_RIDE = '@current_ride_id';

export interface LocationTrackingData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LocationHistoryEntry {
  driver_id: string;
  vehicle_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  is_online: boolean;
  is_available: boolean;
  ride_id: string | null;
  battery_level: number | null;
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };

    if (locations && locations.length > 0) {
      const location = locations[0];

      try {
        const driverData = await AsyncStorage.getItem('@driver_data');
        const vehicleData = await AsyncStorage.getItem('@active_vehicle');
        const currentRideId = await AsyncStorage.getItem(STORAGE_KEY_CURRENT_RIDE);
        const driverStatus = await AsyncStorage.getItem('@driver_status');

        if (!driverData) {
          console.log('No driver data found, skipping location save');
          return;
        }

        const driver = JSON.parse(driverData);
        const vehicle = vehicleData ? JSON.parse(vehicleData) : null;
        const status = driverStatus ? JSON.parse(driverStatus) : { is_online: true, is_available: false };

        let batteryLevel: number | null = null;
        try {
          batteryLevel = await Battery.getBatteryLevelAsync();
          batteryLevel = Math.round(batteryLevel * 100);
        } catch (e) {
          console.log('Could not get battery level:', e);
        }

        // Send location to backend API
        try {
          await apiClient.post(API_ENDPOINTS.LOCATION.UPDATE, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || null,
            altitude: location.coords.altitude || null,
            speed: location.coords.speed || null,
            heading: location.coords.heading || null,
            isOnline: status.is_online ?? true,
            isAvailable: status.is_available ?? false,
            rideId: currentRideId || null,
            vehicleId: vehicle?.id || null,
            batteryLevel,
          });
          console.log('Location saved successfully via API');
        } catch (apiError) {
          console.error('Error saving location to API:', apiError);
        }
      } catch (err) {
        console.error('Error processing location:', err);
      }
    }
  }
});

export const backgroundLocationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Background tracking not available on web');
      return false;
    }

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted');
      return false;
    }

    return true;
  },

  async startTracking(options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
    deferredUpdatesInterval?: number;
    showsBackgroundLocationIndicator?: boolean;
  }): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Background tracking not available on web');
      return false;
    }

    try {
      const hasPermission = await this.requestPermissions();

      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        throw new Error('Background location task is not defined');
      }

      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (isRunning) {
        console.log('Location tracking is already running');
        return true;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: options?.accuracy || Location.Accuracy.High,
        timeInterval: options?.timeInterval || 30000,
        distanceInterval: options?.distanceInterval || 50,
        deferredUpdatesInterval: options?.deferredUpdatesInterval || 60000,
        showsBackgroundLocationIndicator: options?.showsBackgroundLocationIndicator ?? true,
        foregroundService: {
          notificationTitle: 'Tracking actif',
          notificationBody: 'Votre position est suivie pour les courses',
          notificationColor: '#4F46E5',
        },
      });

      await AsyncStorage.setItem(STORAGE_KEY_TRACKING, 'true');
      console.log('Background location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  },

  async stopTracking(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Background location tracking stopped');
      }

      await AsyncStorage.setItem(STORAGE_KEY_TRACKING, 'false');
      return true;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      return false;
    }
  },

  async isTracking(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      return false;
    }
  },

  async setCurrentRide(rideId: string | null): Promise<void> {
    if (rideId) {
      await AsyncStorage.setItem(STORAGE_KEY_CURRENT_RIDE, rideId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_CURRENT_RIDE);
    }
  },

  async updateDriverStatus(isOnline: boolean, isAvailable: boolean): Promise<void> {
    await AsyncStorage.setItem('@driver_status', JSON.stringify({ is_online: isOnline, is_available: isAvailable }));
  },

  /**
   * Get location history from backend
   */
  async getLocationHistory(
    driverId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      rideId?: string;
    }
  ) {
    try {
      const params: Record<string, string> = {};
      
      if (options?.limit) {
        params.limit = options.limit.toString();
      }
      if (options?.startDate) {
        params.startDate = options.startDate.toISOString();
      }
      if (options?.endDate) {
        params.endDate = options.endDate.toISOString();
      }
      if (options?.rideId) {
        params.rideId = options.rideId;
      }

      const response = await apiClient.get<{ locations: any[] }>(
        API_ENDPOINTS.LOCATION.HISTORY,
        { params }
      );

      return response.locations;
    } catch (err) {
      console.error('Error in getLocationHistory:', err);
      return null;
    }
  },

  /**
   * Get last known location from backend
   */
  async getLastLocation(driverId: string) {
    try {
      const response = await apiClient.get<{ location: any }>(
        `${API_ENDPOINTS.DRIVERS.BASE}/location/last`
      );
      return response.location;
    } catch (err) {
      console.error('Error in getLastLocation:', err);
      return null;
    }
  },

  /**
   * Get ride location history from backend
   */
  async getRideLocationHistory(rideId: string) {
    try {
      const response = await apiClient.get<{ locations: any[] }>(
        `${API_ENDPOINTS.RIDES.BASE}/${rideId}/locations`
      );
      return response.locations;
    } catch (err) {
      console.error('Error in getRideLocationHistory:', err);
      return null;
    }
  },

  /**
   * Cleanup old locations (handled by backend)
   */
  async cleanupOldLocations(): Promise<boolean> {
    // This is now handled by the backend automatically
    console.log('Location cleanup is handled by the backend');
    return true;
  },
};
