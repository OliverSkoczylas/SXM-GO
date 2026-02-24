// Leaderboard service for fetching user rankings
// FR-072: Global Leaderboard
// FR-073: Weekly Leaderboard
// FR-074: Monthly Leaderboard

import { getSupabaseClient } from './supabaseClient';
import type { LeaderboardEntry } from '../types/auth.types';

export type LeaderboardType = 'global' | 'weekly' | 'monthly';

/**
 * Fetches the leaderboard data based on the specified type.
 * @param type 'global' | 'weekly' | 'monthly'
 * @param limit Number of entries to fetch (default 100)
 */
export async function getLeaderboard(
  type: LeaderboardType,
  limit: number = 100,
): Promise<{ data: LeaderboardEntry[] | null; error: any }> {
  const supabase = getSupabaseClient();
  
  let functionName: string;
  switch (type) {
    case 'weekly':
      functionName = 'get_weekly_leaderboard';
      break;
    case 'monthly':
      functionName = 'get_monthly_leaderboard';
      break;
    case 'global':
    default:
      functionName = 'get_global_leaderboard';
      break;
  }

  const { data, error } = await supabase.rpc(functionName, {
    limit_count: limit,
  });

  return { data, error };
}
