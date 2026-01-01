import { supabase } from '@/lib/supabase';

export function subscribeToDriverLocation(
  driverId: string,
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void
) {
  const channel = supabase
    .channel(`driver:${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
        filter: `id=eq.${driverId}`,
      },
      (payload: any) => {
        const driver = payload.new;
        if (driver.current_latitude && driver.current_longitude) {
          onLocationUpdate({
            latitude: driver.current_latitude,
            longitude: driver.current_longitude,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToRideStatus(
  rideId: string,
  onStatusChange: (status: string, ride: any) => void
) {
  const channel = supabase
    .channel(`ride:${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: `id=eq.${rideId}`,
      },
      (payload: any) => {
        const ride = payload.new;
        onStatusChange(ride.status, ride);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getDriverInfo(driverId: string) {
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .maybeSingle();

  if (driverError) throw driverError;

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('driver_id', driverId)
    .eq('is_active', true)
    .maybeSingle();

  if (vehicleError) throw vehicleError;

  return { driver, vehicle };
}
