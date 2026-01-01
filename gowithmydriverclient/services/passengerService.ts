import { supabase } from '@/lib/supabase';

export async function getPassengerProfile(userId: string) {
  const { data, error } = await supabase
    .from('passengers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createPassengerProfile(userId: string, email: string, fullName: string) {
  const { data, error } = await supabase
    .from('passengers')
    .insert([
      {
        id: userId,
        email,
        full_name: fullName,
      },
    ])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updatePassengerProfile(
  userId: string,
  updates: {
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
  }
) {
  const { data, error } = await supabase
    .from('passengers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addFavoritePlace(
  passengerId: string,
  place: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    icon?: string;
  }
) {
  const { data, error } = await supabase
    .from('favorite_places')
    .insert([
      {
        passenger_id: passengerId,
        ...place,
      },
    ])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getFavoritePlaces(passengerId: string) {
  const { data, error } = await supabase
    .from('favorite_places')
    .select('*')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteFavoritePlace(placeId: string) {
  const { error } = await supabase
    .from('favorite_places')
    .delete()
    .eq('id', placeId);

  if (error) throw error;
}
