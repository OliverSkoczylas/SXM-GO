// Weekly challenge service
// FR-070: Weekly challenges with leaderboard reset

import { getSupabaseClient } from './supabaseClient';
import { notifyChallengeComplete } from './notificationService';

export interface WeeklyChallenge {
  id: string;
  name: string;
  description: string;
  requirement_type: 'check_ins' | 'category' | 'points' | 'locations';
  requirement_value: number;
  requirement_category: string | null;
  point_reward: number;
  week_start: string;
  week_end: string;
}

export interface WeeklyChallengeProgress {
  challenge: WeeklyChallenge;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
}

// Fetch this week's challenges with user progress
export async function getWeeklyChallenges(): Promise<WeeklyChallengeProgress[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split('T')[0];

  // Get active challenges for this week
  const { data: challenges, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .lte('week_start', today)
    .gte('week_end', today)
    .order('created_at');

  if (error || !challenges) return [];

  // Get user's progress
  const challengeIds = challenges.map(c => c.id);
  const { data: progress } = await supabase
    .from('weekly_challenge_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('challenge_id', challengeIds);

  const progressMap = new Map((progress || []).map(p => [p.challenge_id, p]));

  return challenges.map(challenge => {
    const p = progressMap.get(challenge.id);
    return {
      challenge,
      current_value: p?.current_value || 0,
      completed: p?.completed || false,
      completed_at: p?.completed_at || null,
    };
  });
}

// Update progress for weekly challenges after a check-in
export async function updateWeeklyChallengeProgress(): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];

  // Get active challenges
  const { data: challenges } = await supabase
    .from('weekly_challenges')
    .select('*')
    .lte('week_start', today)
    .gte('week_end', today);

  if (!challenges?.length) return;

  // Get this week's check-ins for progress calculation
  const weekStart = challenges[0].week_start;
  const { data: weekCheckIns } = await supabase
    .from('check_ins')
    .select('id, points_earned, locations(category)')
    .eq('user_id', user.id)
    .gte('created_at', weekStart);

  const totalCheckIns = weekCheckIns?.length || 0;
  const totalPoints = weekCheckIns?.reduce((s, c) => s + c.points_earned, 0) || 0;
  const byCat: Record<string, number> = {};
  weekCheckIns?.forEach((c: any) => {
    const cat = c.locations?.category;
    if (cat) byCat[cat] = (byCat[cat] || 0) + 1;
  });

  for (const challenge of challenges) {
    let currentValue = 0;
    switch (challenge.requirement_type) {
      case 'check_ins': currentValue = totalCheckIns; break;
      case 'points': currentValue = totalPoints; break;
      case 'category': currentValue = byCat[challenge.requirement_category || ''] || 0; break;
      case 'locations': currentValue = totalCheckIns; break;
    }

    const completed = currentValue >= challenge.requirement_value;

    // Upsert progress
    const { data: existing } = await supabase
      .from('weekly_challenge_progress')
      .select('id, completed')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge.id)
      .maybeSingle();

    const wasAlreadyComplete = existing?.completed;

    if (existing) {
      await supabase
        .from('weekly_challenge_progress')
        .update({
          current_value: currentValue,
          completed,
          completed_at: completed && !wasAlreadyComplete ? new Date().toISOString() : undefined,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('weekly_challenge_progress')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          current_value: currentValue,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });
    }

    // Notify on new completion
    if (completed && !wasAlreadyComplete) {
      notifyChallengeComplete(challenge.name, challenge.point_reward).catch(() => {});
    }
  }
}
