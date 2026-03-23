import { supabase } from '../../shared/config/supabase.config';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
}

/**
 * Fetches the top 100 users for the global leaderboard.
 * FR-072, FR-076, FR-079
 * @returns {Promise<LeaderboardEntry[]>} A promise that resolves to an array of leaderboard entries.
 */
export const getGlobalLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, total_points')
    .order('total_points', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching global leaderboard:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  // FR-076: Assign rank based on position in the sorted array
  const rankedData: LeaderboardEntry[] = data.map((profile, index) => ({
    id: profile.id,
    rank: index + 1,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    totalPoints: profile.total_points,
  }));

  return rankedData;
};
