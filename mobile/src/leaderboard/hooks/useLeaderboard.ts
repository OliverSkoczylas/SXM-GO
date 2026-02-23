import { useState, useEffect, useCallback } from 'react';
import { getGlobalLeaderboard, LeaderboardEntry } from '../services/leaderboardService';

export const useLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGlobalLeaderboard();
      setLeaderboardData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboardData,
    loading,
    error,
    refreshLeaderboard: fetchLeaderboard,
  };
};
