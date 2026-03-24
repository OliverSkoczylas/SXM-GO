// Activity tracking service for Strava-style recording
// FR-084 to FR-096: Route tracking and statistics

import { getSupabaseClient } from './supabaseClient';

export interface Activity {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  distance: number;
  duration: number;
  avg_pace: number;
  polyline?: string;
  is_active: boolean;
}

export const activityService = {
  /**
   * Starts a new activity session.
   */
  async startActivity(name: string = 'New Exploration'): Promise<{ data: Activity | null; error: any }> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        name,
        start_time: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Updates an ongoing activity with new stats and polyline data.
   */
  async updateActivity(
    id: string, 
    updates: { distance?: number; duration?: number; avg_pace?: number; polyline?: string }
  ): Promise<{ error: any }> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id);

    return { error };
  },

  /**
   * Finalizes an activity.
   */
  async stopActivity(id: string): Promise<{ error: any }> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('activities')
      .update({
        end_time: new Date().toISOString(),
        is_active: false
      })
      .eq('id', id);

    return { error };
  },

  /**
   * Fetches the user's activity history.
   */
  async getMyActivities(): Promise<{ data: Activity[] | null; error: any }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('is_active', false)
      .order('start_time', { ascending: false });

    return { data, error };
  }
};
