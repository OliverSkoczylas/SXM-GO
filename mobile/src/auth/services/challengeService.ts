// Challenge & Badge service
// FR-059 to FR-070: Badge system with Bronze/Silver/Gold tiers

import { getSupabaseClient } from './supabaseClient';

export type BadgeCategory =
  | 'first_step'
  | 'foodie'
  | 'high_roller'
  | 'sun_chaser'
  | 'island_explorer'
  | 'party_animal'
  | 'shopaholic'
  | 'explorer';

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface BadgeTierDef {
  tier: BadgeTier;
  label: string;
  threshold: number;
  points: number;
}

export interface BadgeDef {
  id: BadgeCategory;
  name: string;
  description: string;
  icon: string;
  category: string | null; // null = all categories
  tiers: BadgeTierDef[];
}

export interface BadgeProgress {
  badge: BadgeDef;
  count: number;              // current check-in count relevant to this badge
  earnedTier: BadgeTier | null;
  nextTier: BadgeTierDef | null;
  earnedTiers: BadgeTier[];
}

// ── Badge definitions (FR-059 to FR-063, FR-068/069) ──

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your very first check-in on the island.',
    icon: '👣',
    category: null,
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 1, points: 25 },
    ],
  },
  {
    id: 'foodie',
    name: 'Foodie',
    description: 'Discover the best restaurants St. Maarten has to offer.',
    icon: '🍽️',
    category: 'Restaurant',
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 3, points: 50 },
      { tier: 'silver', label: 'Silver', threshold: 10, points: 100 },
      { tier: 'gold', label: 'Gold', threshold: 25, points: 250 },
    ],
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Try your luck at the island\'s casinos.',
    icon: '🎰',
    category: 'Casino',
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 1, points: 50 },
      { tier: 'silver', label: 'Silver', threshold: 2, points: 100 },
      { tier: 'gold', label: 'Gold', threshold: 3, points: 200 },
    ],
  },
  {
    id: 'sun_chaser',
    name: 'Sun Chaser',
    description: 'Soak up the sun at St. Maarten\'s stunning beaches.',
    icon: '🏖️',
    category: 'Beach',
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 1, points: 50 },
      { tier: 'silver', label: 'Silver', threshold: 3, points: 100 },
      { tier: 'gold', label: 'Gold', threshold: 5, points: 200 },
    ],
  },
  {
    id: 'island_explorer',
    name: 'Island Explorer',
    description: 'Uncover the history and culture of the island.',
    icon: '🗺️',
    category: 'Attraction',
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 1, points: 50 },
      { tier: 'silver', label: 'Silver', threshold: 3, points: 100 },
      { tier: 'gold', label: 'Gold', threshold: 5, points: 200 },
    ],
  },
  {
    id: 'party_animal',
    name: 'Party Animal',
    description: 'Experience the nightlife and entertainment scene.',
    icon: '🎉',
    category: 'Entertainment',
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 1, points: 50 },
      { tier: 'silver', label: 'Silver', threshold: 3, points: 100 },
      { tier: 'gold', label: 'Gold', threshold: 5, points: 200 },
    ],
  },
  {
    id: 'shopaholic',
    name: 'Shopaholic',
    description: 'Shop till you drop across the island\'s markets and boutiques.',
    icon: '🛍️',
    category: 'Shopping',
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 1, points: 50 },
      { tier: 'silver', label: 'Silver', threshold: 3, points: 100 },
      { tier: 'gold', label: 'Gold', threshold: 5, points: 200 },
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit locations across every corner of St. Maarten.',
    icon: '🧭',
    category: null,
    tiers: [
      { tier: 'bronze', label: 'Bronze', threshold: 5, points: 75 },
      { tier: 'silver', label: 'Silver', threshold: 10, points: 150 },
      { tier: 'gold', label: 'Gold', threshold: 25, points: 300 },
    ],
  },
];

// ── Fetch check-in counts by category ──

async function getCheckInCounts(): Promise<{ total: number; byCategory: Record<string, number> }> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, byCategory: {} };

  const { data } = await supabase
    .from('check_ins')
    .select('locations(category)')
    .eq('user_id', user.id);

  const byCategory: Record<string, number> = {};
  let total = 0;

  data?.forEach((row: any) => {
    const cat = row.locations?.category;
    if (cat) {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    total += 1;
  });

  return { total, byCategory };
}

// ── Compute progress for each badge ──

export async function getBadgeProgress(): Promise<BadgeProgress[]> {
  const { total, byCategory } = await getCheckInCounts();

  return BADGE_DEFINITIONS.map((badge) => {
    const count = badge.category === null ? total : (byCategory[badge.category] || 0);

    const earnedTiers: BadgeTier[] = [];
    let earnedTier: BadgeTier | null = null;
    let nextTier: BadgeTierDef | null = null;

    for (const tierDef of badge.tiers) {
      if (count >= tierDef.threshold) {
        earnedTiers.push(tierDef.tier);
        earnedTier = tierDef.tier;
      } else if (!nextTier) {
        nextTier = tierDef;
      }
    }

    return { badge, count, earnedTier, nextTier, earnedTiers };
  });
}

// ── Award any newly earned badges and update profile.achievements ──

export async function syncBadges(currentAchievements: string[]): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return currentAchievements;

  const progressList = await getBadgeProgress();

  const newAchievements = new Set(currentAchievements);

  for (const { badge, earnedTiers } of progressList) {
    for (const tier of earnedTiers) {
      const key = `${badge.id}_${tier}`;
      newAchievements.add(key);
    }
  }

  const updated = Array.from(newAchievements);

  // Only write if something changed
  if (updated.length !== currentAchievements.length) {
    await supabase
      .from('profiles')
      .update({ achievements: updated })
      .eq('id', user.id);
  }

  return updated;
}

// ── Badge display helpers ──

export function parseBadgeKey(key: string): { badgeId: BadgeCategory; tier: BadgeTier } | null {
  const parts = key.split('_');
  if (parts.length < 2) return null;
  const tier = parts[parts.length - 1] as BadgeTier;
  const badgeId = parts.slice(0, -1).join('_') as BadgeCategory;
  if (!['bronze', 'silver', 'gold'].includes(tier)) return null;
  return { badgeId, tier };
}

export const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};
