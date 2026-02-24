// Location and Check-in service
// FR-014: Fetch location pins
// FR-018: Categorize locations
// FR-027, FR-028: Check-in mechanism

import { getSupabaseClient } from './supabaseClient';

export interface Location {
  id: string;
  name: string;
  description: string;
  category: 'Restaurant' | 'Beach' | 'Casino' | 'Shopping' | 'Attraction' | 'Entertainment';
  latitude: number;
  longitude: number;
  points: number;
  address?: string;
  hours?: string;
  image_url?: string;
  visited?: boolean;
}

export async function getLocations(): Promise<{ data: Location[] | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  
  // FR-014: Fetch all locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*');

  if (locError) return { data: null, error: locError };

  // FR-017: Differentiate between visited and unvisited locations
  if (user.user) {
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('location_id')
      .eq('user_id', user.user.id);

    const visitedIds = new Set(checkIns?.map(c => c.location_id) || []);
    const locationsWithStatus = locations?.map(loc => ({
      ...loc,
      visited: visitedIds.has(loc.id)
    }));

    return { data: locationsWithStatus, error: null };
  }

  return { data: locations, error: null };
}

export async function checkIn(locationId: string, points: number): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: { message: 'User not authenticated' } };

  // FR-027, FR-028: Submit check-in
  const { error } = await supabase
    .from('check_ins')
    .insert({
      user_id: user.id,
      location_id: locationId,
      points_earned: points
    });

  return { error };
}
