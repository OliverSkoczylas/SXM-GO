import { getSupabaseClient } from './supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: { display_name: string; avatar_url: string | null };
  receiver?: { display_name: string; avatar_url: string | null };
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend_profile?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    total_points: number;
    visit_count: number;
  };
}

export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  visit_count: number;
  achievements: string[];
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Searches profiles by display_name, excluding the current user.
 */
export async function searchUsers(
  query: string,
  currentUserId: string,
): Promise<{ data: PublicProfile[] | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, total_points, visit_count, achievements')
    .ilike('display_name', `%${query}%`)
    .neq('id', currentUserId)
    .limit(20);

  return { data: data as PublicProfile[] | null, error };
}

/**
 * Inserts a friend request row from sender to receiver.
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('friend_requests').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: 'pending',
  });

  return { error };
}

/**
 * Deletes a pending friend request by its ID.
 */
export async function cancelFriendRequest(
  requestId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId);

  return { error };
}

/**
 * Marks the request as accepted and creates bidirectional friendship rows.
 */
export async function acceptFriendRequest(
  requestId: string,
  senderId: string,
  receiverId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateError) {
    return { error: updateError };
  }

  const { error: insertError } = await supabase.from('friendships').insert([
    { user_id: senderId, friend_id: receiverId },
    { user_id: receiverId, friend_id: senderId },
  ]);

  return { error: insertError };
}

/**
 * Marks the request as declined.
 */
export async function declineFriendRequest(
  requestId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'declined' })
    .eq('id', requestId);

  return { error };
}

/**
 * Returns all pending requests where the given user is the receiver,
 * including the sender's profile.
 */
export async function getPendingRequests(
  userId: string,
): Promise<{ data: FriendRequest[] | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      sender:profiles!friend_requests_sender_id_fkey(display_name, avatar_url)
    `,
    )
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  return { data: data as FriendRequest[] | null, error };
}

/**
 * Returns all pending requests sent by the given user.
 */
export async function getSentRequests(
  userId: string,
): Promise<{ data: FriendRequest[] | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status, created_at')
    .eq('sender_id', userId)
    .eq('status', 'pending');

  return { data: data as FriendRequest[] | null, error };
}

/**
 * Returns all friends for a user, with the friend's profile attached.
 */
export async function getFriends(
  userId: string,
): Promise<{ data: Friend[] | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      id,
      user_id,
      friend_id,
      created_at,
      friend_profile:profiles!friendships_friend_id_fkey(
        id, display_name, avatar_url, total_points, visit_count
      )
    `,
    )
    .eq('user_id', userId);

  return { data: data as Friend[] | null, error };
}

/**
 * Removes the friendship rows in both directions.
 */
export async function removeFriend(
  userId: string,
  friendId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`,
    );

  return { error };
}

/**
 * Returns public profile fields for a single user.
 */
export async function getPublicProfile(
  userId: string,
): Promise<{ data: PublicProfile | null; error: any }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, total_points, visit_count, achievements')
    .eq('id', userId)
    .single();

  return { data: data as PublicProfile | null, error };
}

/**
 * Returns true if a friendship row exists between the two users.
 */
export async function isFriendsWith(
  userId: string,
  targetId: string,
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', userId)
    .eq('friend_id', targetId)
    .maybeSingle();

  if (error) {
    return false;
  }
  return data !== null;
}

/**
 * Determines the relationship state between two users.
 * Returns one of: 'none' | 'pending_sent' | 'pending_received' | 'friends'
 */
export async function getFriendRequestStatus(
  senderId: string,
  receiverId: string,
): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> {
  const supabase = getSupabaseClient();

  // Check existing friendship first.
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', senderId)
    .eq('friend_id', receiverId)
    .maybeSingle();

  if (friendship !== null) {
    return 'friends';
  }

  // Check for a pending request in either direction.
  const { data: request } = await supabase
    .from('friend_requests')
    .select('sender_id, receiver_id')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),` +
        `and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`,
    )
    .eq('status', 'pending')
    .maybeSingle();

  if (request === null) {
    return 'none';
  }

  return (request as { sender_id: string; receiver_id: string }).sender_id === senderId
    ? 'pending_sent'
    : 'pending_received';
}
