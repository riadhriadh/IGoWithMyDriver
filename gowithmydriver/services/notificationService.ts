/**
 * Notification Service - Backend API version (no Supabase)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '@/lib/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  newRides: boolean;
  planningReminders: boolean;
  supportMessages: boolean;
  payments: boolean;
  soundEnabled: boolean;
}

const PREFERENCES_STORAGE_KEY = '@notification_preferences';

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  },

  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    // Si on est sur un émulateur, retourner un token par défaut
    if (!Constants.isDevice) {
      console.log('Running on emulator/simulator - using default push token');
      return 'ExponentPushToken[emulator-default-token]';
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('Project ID not found - using default token for development');
        return 'ExponentPushToken[dev-default-token]';
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      // Retourner un token par défaut en cas d'erreur pour ne pas bloquer l'app
      return 'ExponentPushToken[error-fallback-token]';
    }
  },

  /**
   * Save push token to backend
   */
  async savePushToken(driverId: string, token: string): Promise<void> {
    console.log('savePushToken', driverId, token);
    try {
      await apiClient.post('/drivers/push-token', { token });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  },

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Local notification:', title, body);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });
  },

  async notifyNewRide(rideDetails: {
    pickupAddress: string;
    dropoffAddress: string;
    price: number;
    scheduledFor?: string;
  }): Promise<void> {
    const isScheduled = rideDetails.scheduledFor ? 'planifiée' : 'immédiate';
    await this.sendLocalNotification(
      'Nouvelle course disponible',
      `${rideDetails.pickupAddress} → ${rideDetails.dropoffAddress}\nCourse ${isScheduled} - ${rideDetails.price}€`,
      { type: 'new_ride', ...rideDetails }
    );
  },

  async notifyPlanningReminder(date: string, shifts: number): Promise<void> {
    await this.sendLocalNotification(
      'Rappel Planning',
      `N'oubliez pas de valider votre planning pour ${date}. ${shifts} créneaux disponibles.`,
      { type: 'planning_reminder', date }
    );
  },

  async notifySupportMessage(message: string): Promise<void> {
    await this.sendLocalNotification(
      'Message du Support',
      message,
      { type: 'support_message' }
    );
  },

  async notifyPaymentReceived(amount: number, date: string): Promise<void> {
    await this.sendLocalNotification(
      'Paiement reçu',
      `Vous avez reçu ${amount}€ pour votre course du ${date}`,
      { type: 'payment', amount, date }
    );
  },

  async notifyRideStatusChange(status: string, rideId: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      assigned: 'Vous avez accepté une course',
      approaching: 'En approche du point de prise en charge',
      arrived: 'Arrivé au point de prise en charge',
      in_progress: 'Course en cours',
      completed: 'Course terminée',
      cancelled: 'Course annulée',
    };

    const message = statusMessages[status] || 'Statut de course mis à jour';

    await this.sendLocalNotification(
      'Mise à jour de course',
      message,
      { type: 'ride_status', status, rideId }
    );
  },

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'web') return 0;
    return await Notifications.getBadgeCountAsync();
  },

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.setBadgeCountAsync(count);
  },

  async clearBadge(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.setBadgeCountAsync(0);
  },

  getDefaultPreferences(): NotificationPreferences {
    return {
      newRides: true,
      planningReminders: true,
      supportMessages: true,
      payments: true,
      soundEnabled: true,
    };
  },

  /**
   * Save preferences to backend and local storage
   */
  async savePreferences(
    driverId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      // Save locally
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      
      // Save to backend
      await apiClient.patch('/drivers/notification-preferences', preferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  },

  /**
   * Get preferences from local storage or backend
   */
  async getPreferences(driverId: string): Promise<NotificationPreferences> {
    try {
      // Try local storage first
      const localPrefs = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (localPrefs) {
        return JSON.parse(localPrefs);
      }

      // Fallback to backend
      const response = await apiClient.get<{ preferences: NotificationPreferences }>(
        '/drivers/notification-preferences'
      );

      if (response.preferences) {
        // Cache locally
        await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(response.preferences));
        return response.preferences;
      }

      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  },
};
