import { getSupabaseClient } from './supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Activity {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  distance_km: number;
  duration_seconds: number;
  avg_pace_min_per_km: number;
  route_points: RoutePoint[];
  check_in_ids: string[];
  title: string | null;
  is_complete: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Standard haversine formula — returns distance in kilometres.
 */
function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const haversine =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return R * c;
}

/**
 * Sums the haversine distance over an ordered array of route points.
 */
function totalDistanceKm(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1], points[i]);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Exported formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a duration in seconds to a human-readable string.
 * Returns "1h 23m" when >= 1 hour, otherwise "45m 12s".
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

/**
 * Formats a pace value (minutes per km) as "M:SS /km".
 */
export function formatPace(paceMinPerKm: number): string {
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')} /km`;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Inserts a new activity row for the given user and returns the created record.
 */
export async function startActivity(
  userId: string,
): Promise<{ data: Activity | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      started_at: new Date().toISOString(),
      ended_at: null,
      distance_km: 0,
      duration_seconds: 0,
      avg_pace_min_per_km: 0,
      route_points: [],
      check_in_ids: [],
      title: null,
      is_complete: false,
    })
    .select()
    .single();

  return { data: data as Activity | null, error };
}

/**
 * Fetches the activity, appends the new point to its route_points JSONB array,
 * recalculates the total distance, and persists the update.
 */
export async function addRoutePoint(
  activityId: string,
  point: RoutePoint,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('activities')
    .select('route_points')
    .eq('id', activityId)
    .single();

  if (fetchError || !existing) {
    throw new Error(
      fetchError?.message ?? `Activity ${activityId} not found`,
    );
  }

  const updatedPoints: RoutePoint[] = [
    ...(existing.route_points as RoutePoint[]),
    point,
  ];
  const newDistanceKm = totalDistanceKm(updatedPoints);

  const { error: updateError } = await supabase
    .from('activities')
    .update({
      route_points: updatedPoints,
      distance_km: newDistanceKm,
    })
    .eq('id', activityId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

/**
 * Finalises an activity: sets ended_at, duration, check-ins, pace, and
 * marks it complete.
 */
export async function stopActivity(
  activityId: string,
  checkInIds: string[],
): Promise<{ data: Activity | null; error: any }> {
  const supabase = getSupabaseClient();

  // Fetch the current row so we can compute duration and pace.
  const { data: existing, error: fetchError } = await supabase
    .from('activities')
    .select('started_at, distance_km')
    .eq('id', activityId)
    .single();

  if (fetchError || !existing) {
    return {
      data: null,
      error: fetchError ?? new Error(`Activity ${activityId} not found`),
    };
  }

  const now = new Date();
  const startedAt = new Date(existing.started_at as string);
  const durationSeconds = Math.round(
    (now.getTime() - startedAt.getTime()) / 1000,
  );

  const distanceKm = existing.distance_km as number;
  const avgPaceMinPerKm =
    distanceKm > 0 ? durationSeconds / 60 / distanceKm : 0;

  const { data, error } = await supabase
    .from('activities')
    .update({
      ended_at: now.toISOString(),
      is_complete: true,
      duration_seconds: durationSeconds,
      check_in_ids: checkInIds,
      avg_pace_min_per_km: avgPaceMinPerKm,
    })
    .eq('id', activityId)
    .select()
    .single();

  return { data: data as Activity | null, error };
}

/**
 * Returns paginated activity history for a user, newest first.
 */
export async function getActivityHistory(
  userId: string,
  limit = 20,
): Promise<{ data: Activity[] | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  return { data: data as Activity[] | null, error };
}

/**
 * Returns a single activity by its ID.
 */
export async function getActivity(
  activityId: string,
): Promise<{ data: Activity | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single();

  return { data: data as Activity | null, error };
}

/**
 * Permanently deletes an activity record.
 */
export async function deleteActivity(
  activityId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId);

  return { error };
}
