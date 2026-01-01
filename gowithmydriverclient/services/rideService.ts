import { supabase } from '@/lib/supabase';

interface RideRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffAddress: string;
  vehicleType?: string;
  paymentMethodId?: string;
  notes?: string;
}

export async function requestRide(request: RideRequest) {
  const distance = calculateDistance(
    request.pickupLatitude,
    request.pickupLongitude,
    request.dropoffLatitude,
    request.dropoffLongitude
  );

  const { data: priceData } = await supabase.rpc('calculate_ride_price', {
    p_distance_km: distance,
    p_vehicle_type: request.vehicleType || 'standard',
  });

  const { data: drivers } = await supabase.rpc('find_available_drivers', {
    p_latitude: request.pickupLatitude,
    p_longitude: request.pickupLongitude,
    p_radius_km: 10,
    p_vehicle_type: request.vehicleType,
  });

  const { data: { user } } = await supabase.auth.getUser();

  const selectedDriver = (drivers && drivers.length > 0) ? drivers[0] : null;

  const { data: rideRequestData, error: requestError } = await supabase
    .from('ride_requests')
    .insert([
      {
        passenger_id: user!.id,
        pickup_latitude: request.pickupLatitude,
        pickup_longitude: request.pickupLongitude,
        pickup_address: request.pickupAddress,
        dropoff_latitude: request.dropoffLatitude,
        dropoff_longitude: request.dropoffLongitude,
        dropoff_address: request.dropoffAddress,
        estimated_distance: distance,
        estimated_price: priceData,
        vehicle_type: request.vehicleType || 'standard',
        payment_method: 'card',
        notes: request.notes,
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        status: selectedDriver ? 'accepted' : 'pending',
        accepted_by: selectedDriver?.driver_id,
      },
    ])
    .select()
    .maybeSingle();

  if (requestError) throw requestError;

  if (!selectedDriver) {
    return { request: rideRequestData, ride: null, nearbyDrivers: [] };
  }

  let realDriverId = selectedDriver.driver_id;

  const { data: driverExists } = await supabase
    .from('drivers')
    .select('id')
    .eq('id', realDriverId)
    .maybeSingle();

  if (!driverExists) {
    const { data: realDrivers } = await supabase
      .from('drivers')
      .select('id')
      .eq('is_online', true)
      .eq('is_available', true)
      .limit(1)
      .maybeSingle();

    if (realDrivers) {
      realDriverId = realDrivers.id;
    } else {
      return { request: rideRequestData, ride: null, nearbyDrivers: drivers || [] };
    }
  }

  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .insert([
      {
        request_id: rideRequestData!.id,
        passenger_id: user!.id,
        driver_id: realDriverId,
        pickup_latitude: request.pickupLatitude,
        pickup_longitude: request.pickupLongitude,
        pickup_address: request.pickupAddress,
        dropoff_latitude: request.dropoffLatitude,
        dropoff_longitude: request.dropoffLongitude,
        dropoff_address: request.dropoffAddress,
        price: priceData,
        status: 'accepted',
        payment_method_id: request.paymentMethodId,
      },
    ])
    .select()
    .maybeSingle();

  if (rideError) {
    console.error('Error creating ride:', rideError);
    return { request: rideRequestData, ride: null, nearbyDrivers: drivers || [] };
  }

  return { request: rideRequestData, ride: ride, nearbyDrivers: drivers || [] };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function subscribeToRideRequest(
  requestId: string,
  onAccepted: (rideId: string) => void
) {
  const channel = supabase
    .channel(`ride-request:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_requests',
        filter: `id=eq.${requestId}`,
      },
      (payload: any) => {
        if (payload.new.status === 'accepted') {
          onAccepted(payload.new.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getRideHistory(passengerId: string) {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function cancelRide(rideId: string, reason: string) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('rides')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
    })
    .eq('id', rideId)
    .eq('passenger_id', user!.id);

  if (error) throw error;
}

export async function getAvailableDrivers(
  latitude: number,
  longitude: number,
  vehicleType?: string
) {
  const { data, error } = await supabase.rpc('find_available_drivers', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: 10,
    p_vehicle_type: vehicleType || null,
  });

  if (error) throw error;
  return data || [];
}

export async function calculateRidePrice(distance: number, vehicleType: string = 'standard') {
  const { data, error } = await supabase.rpc('calculate_ride_price', {
    p_distance_km: distance,
    p_vehicle_type: vehicleType,
  });

  if (error) throw error;
  return data;
}

export async function getRideById(rideId: string) {
  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:drivers(
        id,
        full_name,
        phone_number,
        avatar_url,
        vehicle_make,
        vehicle_model,
        vehicle_plate,
        vehicle_color,
        vehicle_type,
        rating_average,
        current_latitude,
        current_longitude
      )
    `)
    .eq('id', rideId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function subscribeToRideUpdates(
  rideId: string,
  onUpdate: (ride: any) => void
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
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function rateRide(
  rideId: string,
  driverId: string,
  rating: number,
  comment: string,
  tip: number = 0
) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('ratings').insert([
    {
      ride_id: rideId,
      passenger_id: user!.id,
      driver_id: driverId,
      rating,
      comment,
      rated_by: 'passenger',
    },
  ]);

  if (error) throw error;

  if (tip > 0) {
    const { data: ride } = await supabase
      .from('rides')
      .select('price')
      .eq('id', rideId)
      .maybeSingle();

    if (ride) {
      await supabase
        .from('rides')
        .update({
          price: ride.price + tip,
          tip_amount: tip,
        })
        .eq('id', rideId);
    }
  }
}
