import { useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { locationService } from '@/services/locationService';
import { useAuth } from '@/contexts/AuthContext';

export function LocationTracker() {
  const { location } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!location || !user) return;

    const updateLocation = async () => {
      await locationService.updateDriverLocation(
        user.id,
        location.latitude,
        location.longitude
      );
    };

    updateLocation();

    const interval = setInterval(updateLocation, 30000);

    return () => clearInterval(interval);
  }, [location, user]);

  return null;
}
