/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  
  // Drivers
  DRIVERS: {
    BASE: '/drivers',
    PROFILE: '/drivers/profile',
    UPDATE_STATUS: '/drivers/status',
    UPDATE_LOCATION: '/drivers/location',
    EARNINGS: '/drivers/earnings',
    STATS: '/drivers/stats',
  },
  
  // Rides
  RIDES: {
    BASE: '/rides',
    ACTIVE: '/rides/active',
    HISTORY: '/rides/history',
    ACCEPT: (id: string) => `/rides/${id}/accept`,
    START: (id: string) => `/rides/${id}/start`,
    COMPLETE: (id: string) => `/rides/${id}/complete`,
    CANCEL: (id: string) => `/rides/${id}/cancel`,
  },
  
  // Location
  LOCATION: {
    UPDATE: '/location/update',
    HISTORY: '/location/history',
  },
  
  // Ratings
  RATINGS: {
    BASE: '/ratings',
    SUBMIT: '/ratings',
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/payments',
    HISTORY: '/payments/history',
    PAYOUT: '/payments/payout',
  },
};

