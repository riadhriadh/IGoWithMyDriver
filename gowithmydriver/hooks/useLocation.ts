import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setError('Permission de localisation refusée');
          setPermissionGranted(false);
          setLoading(false);
          return;
        }

        setPermissionGranted(true);

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          altitude: currentLocation.coords.altitude,
          heading: currentLocation.coords.heading,
          speed: currentLocation.coords.speed,
        });

        setLoading(false);

        if (Platform.OS !== 'web') {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 10000,
              distanceInterval: 10,
            },
            (newLocation) => {
              setLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                accuracy: newLocation.coords.accuracy,
                altitude: newLocation.coords.altitude,
                heading: newLocation.coords.heading,
                speed: newLocation.coords.speed,
              });
            }
          );
        }
      } catch (err) {
        setError('Erreur lors de la récupération de la position');
        setLoading(false);
      }
    };

    setupLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const refreshLocation = async () => {
    if (!permissionGranted) return;

    try {
      const newLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
        accuracy: newLocation.coords.accuracy,
        altitude: newLocation.coords.altitude,
        heading: newLocation.coords.heading,
        speed: newLocation.coords.speed,
      });
    } catch (err) {
      setError('Erreur lors de la mise à jour de la position');
    }
  };

  return {
    location,
    error,
    loading,
    permissionGranted,
    refreshLocation,
  };
}
