// Challenge service for fetching and updating user progress
// FR-059 to FR-071: Challenges and badges

import { getSupabaseClient } from './supabaseClient';
import type { ChallengeWithProgress } from '../types/challenge.types';

/**
 * Fetches all active challenges along with the current user's progress.
 */
export async function getChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const supabase = getSupabaseClient();

  // Fetch all active challenges
  const { data: challenges, error: chError } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('requirement_count', { ascending: true });

  if (chError) {
    console.error('[ChallengeService] Error fetching challenges:', chError);
    return [];
  }

  // Fetch user's progress for these challenges
  const { data: progress, error: prError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId);

  if (prError) {
    console.error('[ChallengeService] Error fetching progress:', prError);
    // Continue anyway, just return 0 progress for all
  }

  // Map progress to challenges
  const progressMap = new Map(progress?.map(p => [p.challenge_id, p]) || []);

  return (challenges || []).map(ch => {
    const userProgress = progressMap.get(ch.id);
    return {
      id: ch.id,
      name: ch.name,
      description: ch.description,
      category: ch.category,
      pointsReward: ch.points_reward,
      requirementCount: ch.requirement_count,
      tier: ch.tier,
      iconName: ch.icon_name || 'trophy-outline',
      progress: {
        challengeId: ch.id,
        currentCount: userProgress?.current_count || 0,
        isCompleted: userProgress?.is_completed || false,
      },
    };
  });
}
