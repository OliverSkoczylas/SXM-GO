import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getChallenges } from '../services/challengeService';
import { ChallengeWithProgress } from '../types/challenge.types';

export const useChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChallenges = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await getChallenges(user.id);
      setChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch challenges'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [user?.id]);

  return {
    challenges,
    isLoading,
    error,
    refresh: fetchChallenges,
  };
};
