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

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function checkIn(
  locationId: string, 
  points: number, 
  userCoords?: { latitude: number; longitude: number },
  targetCoords?: { latitude: number; longitude: number }
): Promise<{ error: any }> {
  // FR-027, FR-028: Proximity verification (100 meters)
  if (userCoords && targetCoords) {
    const distance = getDistance(
      userCoords.latitude,
      userCoords.longitude,
      targetCoords.latitude,
      targetCoords.longitude
    );
    
    if (distance > 100) {
      return { 
        error: { 
          message: `Too far! You are ${Math.round(distance)}m away. Move closer (within 100m) to check in.` 
        } 
      };
    }
  }

  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: { message: 'User not authenticated' } };

  const { error } = await supabase
    .from('check_ins')
    .insert({
      user_id: user.id,
      location_id: locationId,
      points_earned: points
    });

  return { error };
}
