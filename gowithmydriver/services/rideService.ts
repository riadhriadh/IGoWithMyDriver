/**
 * Ride Service
 * Handles ride-related API calls
 */

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/api.config';

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  status: 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  pickupLocation: Location;
  dropoffLocation: Location;
  estimatedPrice?: number;
  finalPrice?: number;
  distance?: number;
  duration?: number;
  passenger?: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RideAcceptData {
  estimatedArrivalTime?: number; // in minutes
}

export interface RideCompleteData {
  finalPrice: number;
  actualDistance: number;
  actualDuration: number;
}

export interface RideCancelData {
  reason: string;
  cancelledBy: 'driver' | 'passenger';
}

export const rideService = {
  /**
   * Get all available rides (pending rides near driver)
   */
  async getAvailableRides(location?: Location): Promise<Ride[]> {
    try {
      const params = location 
        ? { lat: location.latitude, lng: location.longitude }
        : {};
      
      const response = await apiClient.get<{ rides: Ride[] }>(
        API_ENDPOINTS.RIDES.BASE,
        { params }
      );
      
      return response.rides;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get active ride (accepted or in progress)
   */
  async getActiveRide(): Promise<Ride | null> {
    try {
      const response = await apiClient.get<{ ride: Ride | null }>(
        API_ENDPOINTS.RIDES.ACTIVE
      );
      
      return response.ride;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get ride history
   */
  async getRideHistory(page = 1, limit = 20): Promise<{ rides: Ride[]; total: number }> {
    try {
      const response = await apiClient.get<{ rides: Ride[]; total: number }>(
        API_ENDPOINTS.RIDES.HISTORY,
        { params: { page, limit } }
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get ride by ID
   */
  async getRideById(id: string): Promise<Ride> {
    try {
      const response = await apiClient.get<{ ride: Ride }>(
        `${API_ENDPOINTS.RIDES.BASE}/${id}`
      );
      console.log('response--getRideById', response);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Accept a ride
   */
  async acceptRide(rideId: string, data?: RideAcceptData): Promise<Ride> {
    try {
      const response = await apiClient.post<{ ride: Ride }>(
        API_ENDPOINTS.RIDES.ACCEPT(rideId),
        data
      );
      
      return response.ride;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Start a ride (driver arrived and passenger is in car)
   */
  async startRide(rideId: string): Promise<Ride> {
    try {
      const response = await apiClient.post<{ ride: Ride }>(
        API_ENDPOINTS.RIDES.START(rideId)
      );
      
      return response.ride;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Complete a ride
   */
  async completeRide(rideId: string, data: RideCompleteData): Promise<Ride> {
    try {
      const response = await apiClient.post<{ ride: Ride }>(
        API_ENDPOINTS.RIDES.COMPLETE(rideId),
        data
      );
      
      return response.ride;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel a ride
   */
  async cancelRide(rideId: string, data: RideCancelData): Promise<Ride> {
    try {
      const response = await apiClient.post<{ ride: Ride }>(
        API_ENDPOINTS.RIDES.CANCEL(rideId),
        data
      );
      
      return response.ride;
    } catch (error) {
      throw error;
    }
  },
};

export default rideService;

