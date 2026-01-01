/**
 * Location Service - Backend API version (no Supabase)
 */

import * as Location from 'expo-location';
import { Platform, Linking } from 'react-native';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/api.config';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  isOnline?: boolean;
  isAvailable?: boolean;
  rideId?: string;
  vehicleId?: string;
}

export const locationService = {
  /**
   * Update driver location via backend API
   */
  async updateDriverLocation(driverId: string, latitude: number, longitude: number): Promise<boolean> {
    try {
      await apiClient.post(API_ENDPOINTS.DRIVERS.UPDATE_LOCATION, {
        latitude,
        longitude,
      });
      return true;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return false;
    }
  },

  /**
   * Update driver location with full details
   */
  async updateLocationFull(data: LocationUpdate): Promise<boolean> {
    try {
      await apiClient.post(API_ENDPOINTS.LOCATION.UPDATE, data);
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  },

  /**
   * Get location history
   */
  async getLocationHistory(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<{ locations: any[] }>(
        API_ENDPOINTS.LOCATION.HISTORY,
        { params }
      );
      return response.locations;
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  },

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  },

  toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  },

  formatDistance(distanceInKm: number): string {
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
  },

  async openNavigationApp(
    destination: Coordinates,
    appPreference: 'waze' | 'google' | 'apple' = 'google'
  ) {
    const { latitude, longitude } = destination;

    if (Platform.OS === 'web') {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(googleMapsUrl, '_blank');
      return;
    }

    let url = '';

    switch (appPreference) {
      case 'waze':
        url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
        const wazeWebUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

        const wazeSupported = await Linking.canOpenURL(url);
        if (wazeSupported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(wazeWebUrl);
        }
        break;

      case 'apple':
        if (Platform.OS === 'ios') {
          url = `maps://app?daddr=${latitude},${longitude}`;
          await Linking.openURL(url);
        } else {
          this.openNavigationApp(destination, 'google');
        }
        break;

      case 'google':
      default:
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        await Linking.openURL(url);
        break;
    }
  },

  async getCurrentPosition(): Promise<Coordinates | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  },

  estimateArrivalTime(distanceInKm: number, averageSpeedKmh: number = 40): number {
    const timeInHours = distanceInKm / averageSpeedKmh;
    const timeInMinutes = Math.round(timeInHours * 60);
    return timeInMinutes;
  },

  formatETA(minutes: number): string {
    if (minutes < 1) {
      return 'Moins d\'1 min';
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  },
};
