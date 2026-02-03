// User preferences CRUD operations
// FR-005: Users shall be able to update settings
// UX-009: Notification preferences
// FR-111: Language preferences

import { getSupabaseClient } from './supabaseClient';
import type { UserPreferences, UserPreferencesUpdate } from '../types/auth.types';

export async function getPreferences(
  userId: string,
): Promise<{ data: UserPreferences | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function updatePreferences(
  userId: string,
  updates: UserPreferencesUpdate,
): Promise<{ data: UserPreferences | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}
