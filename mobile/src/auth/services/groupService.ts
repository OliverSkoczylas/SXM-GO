// Group service for private leaderboards
// FR-075: Group Leaderboard
// FR-080 to FR-083: Private group management

import { getSupabaseClient } from './supabaseClient';
import type { LeaderboardEntry } from '../types/auth.types';

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  created_at: string;
  member_count?: number;
}

/**
 * Creates a new private group.
 */
export async function createGroup(name: string): Promise<{ data: Group | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Not authenticated' };

  // Generate a random 6-character code
  const { data: inviteCode } = await supabase.rpc('generate_invite_code');

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name,
      invite_code: inviteCode,
      creator_id: user.id
    })
    .select()
    .single();

  if (data) {
    // Automatically join the creator to the group
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: user.id
    });
  }

  return { data, error };
}

/**
 * Joins a group using an invite code.
 */
export async function joinGroup(inviteCode: string): Promise<{ data: any; error: any }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Not authenticated' };

  // Find the group
  const { data: group, error: findError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (findError || !group) return { data: null, error: 'Group not found' };

  // Join the group
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id
    });

  return { data, error };
}

/**
 * Fetches the list of groups the user belongs to.
 */
export async function getMyGroups(): Promise<{ data: Group[] | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(user_id)
    `)
    .eq('group_members.user_id', user.id);

  return { data: data as any, error };
}

/**
 * Fetches the leaderboard for a specific group.
 */
export async function getGroupLeaderboardData(groupId: string): Promise<{ data: LeaderboardEntry[] | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_group_leaderboard', {
    target_group_id: groupId
  });
  return { data, error };
}
