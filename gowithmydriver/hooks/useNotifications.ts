import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationService, NotificationPreferences } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  badgeCount: number;
  preferences: NotificationPreferences;
  loading: boolean;
  updatePreferences: (prefs: NotificationPreferences) => Promise<void>;
  clearBadge: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getDefaultPreferences()
  );
  const [loading, setLoading] = useState(true);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user || Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    async function setupNotifications() {
      try {
        const token = await notificationService.registerForPushNotifications();
        setExpoPushToken(token);

        if (token && user.id) {
          await notificationService.savePushToken(user.id, token);
        }

        const prefs = await notificationService.getPreferences(user.id);
        setPreferences(prefs);

        const count = await notificationService.getBadgeCount();
        setBadgeCount(count);
      } catch (error) {
        console.error('Error setting up notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        setBadgeCount((prev) => prev + 1);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationResponse(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  function handleNotificationResponse(data: any) {
    console.log('Notification tapped:', data);
  }

  async function updatePreferences(prefs: NotificationPreferences) {
    if (!user?.id) return;

    setPreferences(prefs);
    await notificationService.savePreferences(user.id, prefs);
  }

  async function clearBadge() {
    await notificationService.clearBadge();
    setBadgeCount(0);
  }

  async function sendTestNotification() {
    await notificationService.sendLocalNotification(
      'Test de notification',
      'Ceci est une notification de test',
      { type: 'test' }
    );
  }

  return {
    expoPushToken,
    notification,
    badgeCount,
    preferences,
    loading,
    updatePreferences,
    clearBadge,
    sendTestNotification,
  };
}
