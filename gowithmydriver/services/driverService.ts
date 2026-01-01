/**
 * Driver Service
 * Handles driver-related API calls
 */

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/api.config';
import { DriverProfile } from './authService';

export interface UpdateDriverProfileData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  };
}

export interface DriverStatus {
  status: 'offline' | 'available' | 'busy' | 'on_ride';
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export interface DriverEarnings {
  today: number;
  week: number;
  month: number;
  total: number;
  currency: string;
}

export interface DriverStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  rating: number;
  totalRatings: number;
  acceptanceRate: number;
  totalEarnings: number;
}

export const driverService = {
  /**
   * Get driver profile
   */
  async getProfile(): Promise<DriverProfile> {
    try {
      const response = await apiClient.get<{ driver: DriverProfile }>(
        API_ENDPOINTS.DRIVERS.PROFILE
      );
      
      return response.driver;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update driver profile
   */
  async updateProfile(data: UpdateDriverProfileData): Promise<DriverProfile> {
    try {
      const response = await apiClient.patch<{ driver: DriverProfile }>(
        API_ENDPOINTS.DRIVERS.PROFILE,
        data
      );
      
      return response.driver;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update driver status (online/offline/busy)
   */
  async updateStatus(status: DriverStatus['status']): Promise<void> {
    try {
      await apiClient.patch(API_ENDPOINTS.DRIVERS.UPDATE_STATUS, { status });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update driver location
   */
  async updateLocation(location: DriverLocation): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.DRIVERS.UPDATE_LOCATION, location);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get driver earnings
   */
  async getEarnings(): Promise<DriverEarnings> {
    try {
      const response = await apiClient.get<{ earnings: DriverEarnings }>(
        API_ENDPOINTS.DRIVERS.EARNINGS
      );
      
      return response.earnings;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get driver statistics
   */
  async getStats(): Promise<DriverStats> {
    try {
      const response = await apiClient.get<{ stats: DriverStats }>(
        API_ENDPOINTS.DRIVERS.STATS
      );
      
      return response.stats;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload driver avatar
   */
  async uploadAvatar(file: File | Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.upload<{ avatarUrl: string }>(
        `${API_ENDPOINTS.DRIVERS.PROFILE}/avatar`,
        formData
      );
      
      return response.avatarUrl;
    } catch (error) {
      throw error;
    }
  },
};

export default driverService;

