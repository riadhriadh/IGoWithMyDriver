/**
 * Authentication Service
 * Handles authentication with the backend API
 */

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/api.config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role?: 'driver'; // Always driver for this app
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    driver?: DriverProfile;
  };
}

export interface DriverProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  status: 'offline' | 'available' | 'busy' | 'on_ride';
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  };
  rating?: number;
  totalRides?: number;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('credentials--login', credentials);
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      console.log('response--login', response);

      // Store tokens
      await apiClient.setTokens(response.accessToken, response.refreshToken);

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Register a new driver
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    alert(JSON.stringify(data))
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          ...data,
          role: 'driver',
        }
      );

      // Store tokens
      await apiClient.setTokens(response.accessToken, response.refreshToken);

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call result
      await apiClient.clearTokens();
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<DriverProfile> {
    try {
      const response = await apiClient.get<{ user: { driver: DriverProfile } }>(
        API_ENDPOINTS.AUTH.PROFILE
      );
      return response.user.driver;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      // Store new tokens
      await apiClient.setTokens(response.accessToken, response.refreshToken);

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getAccessToken();
    return !!token;
  },
};

export default authService;

