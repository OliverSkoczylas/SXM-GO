// Location and Check-in service
// FR-014: Fetch location pins
// FR-018: Categorize locations
// FR-024: Cache location data for offline viewing
// FR-026: Offline check-ins sync when connection restored
// FR-027, FR-028: Check-in mechanism
// FR-032, FR-033: Anti-fraud GPS spoofing detection

import { getSupabaseClient } from './supabaseClient';
import { cacheLocations, getCachedLocations, queueOfflineCheckIn, syncPendingCheckIns, isOnline } from './offlineService';
import { validateCheckIn, recordCheckInPosition, flagSuspiciousCheckIn } from './fraudDetectionService';
import { updateWeeklyChallengeProgress } from './weeklyChallengeService';

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

  if (locError) {
    // FR-024: Fall back to cached locations when offline
    const cached = await getCachedLocations();
    if (cached) {
      return { data: cached, error: null };
    }
    return { data: null, error: locError };
  }

  // FR-017: Differentiate between visited and unvisited locations
  let locationsWithStatus = locations;
  if (user.user) {
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('location_id')
      .eq('user_id', user.user.id);

    const visitedIds = new Set(checkIns?.map(c => c.location_id) || []);
    locationsWithStatus = locations?.map(loc => ({
      ...loc,
      visited: visitedIds.has(loc.id),
    }));
  }

  // FR-024: Cache for offline use
  if (locationsWithStatus) {
    await cacheLocations(locationsWithStatus);
  }

  // FR-026: Sync any pending offline check-ins
  const online = await isOnline();
  if (online) {
    const syncResult = await syncPendingCheckIns();
    if (syncResult.synced > 0) {
      console.log(`[Location] Synced ${syncResult.synced} offline check-ins`);
    }
  }

  return { data: locationsWithStatus, error: null };
}

// FR-042: Activity feed — recent check-ins with location details
export interface ActivityItem {
  id: string;
  location_name: string;
  category: string;
  points: number;
  created_at: string;
}

export async function getActivityFeed(
  limit = 10,
): Promise<{ data: ActivityItem[] | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: 'Not authenticated' } };

  const { data, error } = await supabase
    .from('check_ins')
    .select('id, points_earned, created_at, locations(name, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: null, error };

  const items: ActivityItem[] = (data || []).map((row: any) => ({
    id: row.id,
    location_name: row.locations?.name ?? 'Unknown location',
    category: row.locations?.category ?? '',
    points: row.points_earned,
    created_at: row.created_at,
  }));

  return { data: items, error: null };
}

// ── Check-In with Fraud Detection ──────────────────────────────────────────

export interface CheckInResult {
  error: any;
  flagged: boolean;
  offline: boolean;
}

export async function checkIn(location: Location): Promise<CheckInResult> {
  // FR-032: Validate GPS position and check for spoofing
  const validation = await validateCheckIn(location.latitude, location.longitude);

  if (!validation.allowed) {
    return {
      error: { message: validation.denyReason || 'Check-in not allowed' },
      flagged: false,
      offline: false,
    };
  }

  const gps = validation.gps!;

  // Check if we're online
  const online = await isOnline();

  if (!online) {
    // FR-026: Queue for offline sync
    await queueOfflineCheckIn({
      locationId: location.id,
      points: location.points,
      gpsLatitude: gps.latitude,
      gpsLongitude: gps.longitude,
      timestamp: new Date().toISOString(),
    });
    await recordCheckInPosition(gps.latitude, gps.longitude);
    return { error: null, flagged: false, offline: true };
  }

  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'User not authenticated' }, flagged: false, offline: false };

  // FR-027, FR-028: Submit check-in with GPS coordinates
  const { error } = await supabase
    .from('check_ins')
    .insert({
      user_id: user.id,
      location_id: location.id,
      points_earned: location.points,
      gps_latitude: gps.latitude,
      gps_longitude: gps.longitude,
    });

  if (error) return { error, flagged: false, offline: false };

  // Record position for future fraud checks
  await recordCheckInPosition(gps.latitude, gps.longitude);

  // FR-033: Flag suspicious patterns (non-blocking)
  let flagged = false;
  if (validation.fraudResult?.isSuspicious) {
    flagged = true;
    flagSuspiciousCheckIn(location.id, validation.fraudResult, gps.latitude, gps.longitude)
      .catch(e => console.warn('[Fraud] Failed to flag:', e));
  }

  // FR-070: Update weekly challenge progress (non-blocking)
  updateWeeklyChallengeProgress().catch(e => console.warn('[Weekly] Progress update failed:', e));

  return { error: null, flagged, offline: false };
}
