// Friend and Social service
// FR-097 to FR-100: User interactions and friend requests

import { getSupabaseClient } from './supabaseClient';
import type { Profile } from '../types/auth.types';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  display_name?: string;
  avatar_url?: string;
  total_points?: number;
}

export const friendService = {
  /**
   * Searches for users by username or email.
   */
  async searchUsers(query: string): Promise<{ data: Profile[] | null; error: any }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,id.eq.${query}`)
      .limit(20);

    return { data, error };
  },

  /**
   * Sends a friend request.
   */
  async sendFriendRequest(friendId: string): Promise<{ error: any }> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    return { error };
  },

  /**
   * Fetches the user's friends (accepted status).
   */
  async getFriends(): Promise<{ data: Friendship[] | null; error: any }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('friends_view')
      .select('*');

    return { data, error };
  },

  /**
   * Fetches pending friend requests sent to the user.
   */
  async getPendingRequests(): Promise<{ data: Friendship[] | null; error: any }> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        profiles!user_id(display_name, avatar_url, total_points)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    return { data: data as any, error };
  },

  /**
   * Accepts or rejects a friend request.
   */
  async respondToRequest(friendshipId: string, accept: boolean): Promise<{ error: any }> {
    const supabase = getSupabaseClient();
    if (accept) {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
      return { error };
    } else {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      return { error };
    }
  }
};
