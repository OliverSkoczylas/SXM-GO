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

// ── FR-082: Group member management ────────────────────────────────────────

export interface GroupMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  joined_at: string;
}

export async function getGroupMembers(groupId: string): Promise<{ data: GroupMember[] | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, created_at, profiles(display_name, avatar_url)')
    .eq('group_id', groupId);

  if (error) return { data: null, error };

  const members: GroupMember[] = (data || []).map((m: any) => ({
    user_id: m.user_id,
    display_name: m.profiles?.display_name || 'Anonymous',
    avatar_url: m.profiles?.avatar_url || null,
    joined_at: m.created_at,
  }));

  return { data: members, error: null };
}

export async function removeMemberFromGroup(groupId: string, userId: string): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  return { error };
}

export async function leaveGroup(groupId: string): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id);
  return { error };
}
