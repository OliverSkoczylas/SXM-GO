// Offline caching and sync service
// FR-024: Cache location data for offline viewing
// FR-025: Download island map for offline use
// FR-026: Offline check-ins sync when connection restored

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from './supabaseClient';
import type { Location } from './locationService';

const CACHED_LOCATIONS_KEY = 'offline_locations';
const CACHED_LOCATIONS_TIMESTAMP_KEY = 'offline_locations_ts';
const PENDING_CHECKINS_KEY = 'offline_pending_checkins';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Location Cache ─────────────────────────────────────────────────────────

export async function cacheLocations(locations: Location[]): Promise<void> {
  await AsyncStorage.setItem(CACHED_LOCATIONS_KEY, JSON.stringify(locations));
  await AsyncStorage.setItem(CACHED_LOCATIONS_TIMESTAMP_KEY, String(Date.now()));
}

export async function getCachedLocations(): Promise<Location[] | null> {
  const raw = await AsyncStorage.getItem(CACHED_LOCATIONS_KEY);
  if (!raw) return null;

  const ts = await AsyncStorage.getItem(CACHED_LOCATIONS_TIMESTAMP_KEY);
  if (ts && Date.now() - Number(ts) > CACHE_TTL_MS) {
    return null; // Cache expired
  }

  return JSON.parse(raw);
}

export async function isCacheValid(): Promise<boolean> {
  const ts = await AsyncStorage.getItem(CACHED_LOCATIONS_TIMESTAMP_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) <= CACHE_TTL_MS;
}

// ── Pending Check-in Queue ─────────────────────────────────────────────────

export interface PendingCheckIn {
  locationId: string;
  points: number;
  gpsLatitude: number;
  gpsLongitude: number;
  timestamp: string;
}

export async function queueOfflineCheckIn(checkIn: PendingCheckIn): Promise<void> {
  const pending = await getPendingCheckIns();
  pending.push(checkIn);
  await AsyncStorage.setItem(PENDING_CHECKINS_KEY, JSON.stringify(pending));
}

export async function getPendingCheckIns(): Promise<PendingCheckIn[]> {
  const raw = await AsyncStorage.getItem(PENDING_CHECKINS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearPendingCheckIns(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_CHECKINS_KEY);
}

// ── Sync Pending Check-ins ─────────────────────────────────────────────────

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export async function syncPendingCheckIns(): Promise<SyncResult> {
  const pending = await getPendingCheckIns();
  if (pending.length === 0) return { synced: 0, failed: 0, errors: [] };

  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { synced: 0, failed: pending.length, errors: ['Not authenticated'] };

  const result: SyncResult = { synced: 0, failed: 0, errors: [] };
  const remaining: PendingCheckIn[] = [];

  for (const checkIn of pending) {
    const { error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        location_id: checkIn.locationId,
        points_earned: checkIn.points,
        gps_latitude: checkIn.gpsLatitude,
        gps_longitude: checkIn.gpsLongitude,
      });

    if (error) {
      // Duplicate check-in errors are expected — treat as success
      if (error.code === '23505') {
        result.synced++;
      } else {
        result.failed++;
        result.errors.push(`${checkIn.locationId}: ${error.message}`);
        remaining.push(checkIn);
      }
    } else {
      result.synced++;
    }
  }

  // Keep only the ones that genuinely failed
  await AsyncStorage.setItem(PENDING_CHECKINS_KEY, JSON.stringify(remaining));

  return result;
}

// ── Network State Helper ───────────────────────────────────────────────────

export async function isOnline(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await Promise.race([
      supabase.from('locations').select('id').limit(1),
      new Promise<{ error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ error: { message: 'timeout' } }), 3000),
      ),
    ]);
    return !error;
  } catch {
    return false;
  }
}
