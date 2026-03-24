export type ChallengeTier = 'Bronze' | 'Silver' | 'Gold';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: 'Restaurant' | 'Beach' | 'Casino' | 'Activity' | 'Other';
  pointsReward: number;
  requirementCount: number;
  tier: ChallengeTier;
  iconName: string;
  isTimeLimited?: boolean;
  deadline?: string;
}

export interface UserChallengeProgress {
  challengeId: string;
  currentCount: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ChallengeWithProgress extends Challenge {
  progress: UserChallengeProgress;
}
