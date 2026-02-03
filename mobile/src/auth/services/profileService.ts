// Profile CRUD operations
// FR-002: User profiles store name, photo, visit history, points, achievements
// FR-005: Users shall be able to update profile information
// FR-007/FR-008: Location tracking toggle

import { getSupabaseClient } from './supabaseClient';
import { sanitizeProfileUpdate } from '../utils/inputSanitizer';
import type { Profile, ProfileUpdate } from '../types/auth.types';

export async function getProfile(
  userId: string,
): Promise<{ data: Profile | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate,
): Promise<{ data: Profile | null; error: any }> {
  const supabase = getSupabaseClient();
  const sanitized = sanitizeProfileUpdate(updates as Record<string, unknown>);
  const { data, error } = await supabase
    .from('profiles')
    .update(sanitized)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export async function setLocationTracking(
  userId: string,
  enabled: boolean,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ location_tracking_enabled: enabled })
    .eq('id', userId);
  return { error };
}
