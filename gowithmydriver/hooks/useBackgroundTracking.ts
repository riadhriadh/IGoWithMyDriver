import { useState, useEffect, useCallback } from 'react';
import { backgroundLocationService } from '@/services/backgroundLocationService';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

interface BackgroundTrackingOptions {
  accuracy?: Location.Accuracy;
  timeInterval?: number;
  distanceInterval?: number;
  deferredUpdatesInterval?: number;
  showsBackgroundLocationIndicator?: boolean;
}

export function useBackgroundTracking(autoStart: boolean = false, options?: BackgroundTrackingOptions) {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkTrackingStatus();
  }, []);

  useEffect(() => {
    if (autoStart && hasPermission && !isTracking) {
      startTracking();
    }
  }, [autoStart, hasPermission]);

  const checkTrackingStatus = async () => {
    if (Platform.OS === 'web') {
      setLoading(false);
      setError('Le tracking en arrière-plan n\'est pas disponible sur web');
      return;
    }

    try {
      const tracking = await backgroundLocationService.isTracking();
      setIsTracking(tracking);

      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      setHasPermission(
        foregroundStatus === 'granted' && backgroundStatus === 'granted'
      );
    } catch (err) {
      setError('Erreur lors de la vérification du statut');
      console.error('Error checking tracking status:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const granted = await backgroundLocationService.requestPermissions();
      setHasPermission(granted);

      if (!granted) {
        setError('Permissions de localisation refusées');
      }

      return granted;
    } catch (err) {
      setError('Erreur lors de la demande de permissions');
      console.error('Error requesting permissions:', err);
      return false;
    }
  }, []);

  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          return false;
        }
      }

      const started = await backgroundLocationService.startTracking(options);

      if (started) {
        setIsTracking(true);
      } else {
        setError('Impossible de démarrer le tracking');
      }

      return started;
    } catch (err) {
      setError('Erreur lors du démarrage du tracking');
      console.error('Error starting tracking:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, options]);

  const stopTracking = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const stopped = await backgroundLocationService.stopTracking();

      if (stopped) {
        setIsTracking(false);
      } else {
        setError('Impossible d\'arrêter le tracking');
      }

      return stopped;
    } catch (err) {
      setError('Erreur lors de l\'arrêt du tracking');
      console.error('Error stopping tracking:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTracking = useCallback(async (): Promise<boolean> => {
    if (isTracking) {
      return await stopTracking();
    } else {
      return await startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  const setCurrentRide = useCallback(async (rideId: string | null) => {
    await backgroundLocationService.setCurrentRide(rideId);
  }, []);

  const updateDriverStatus = useCallback(async (isOnline: boolean, isAvailable: boolean) => {
    await backgroundLocationService.updateDriverStatus(isOnline, isAvailable);
  }, []);

  return {
    isTracking,
    hasPermission,
    loading,
    error,
    startTracking,
    stopTracking,
    toggleTracking,
    requestPermissions,
    setCurrentRide,
    updateDriverStatus,
  };
}
