// Challenges & Badges screen
// FR-059 to FR-070: Badge system with Bronze/Silver/Gold tiers and progress tracking

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  getBadgeProgress,
  TIER_COLORS,
  type BadgeProgress,
  type BadgeTier,
} from '../services/challengeService';

// ── Tier dot indicator ──

function TierDots({ tiers, earnedTiers }: { tiers: { tier: BadgeTier }[]; earnedTiers: BadgeTier[] }) {
  if (tiers.length <= 1) return null;
  return (
    <View style={styles.tierDots}>
      {tiers.map(({ tier }) => {
        const earned = earnedTiers.includes(tier);
        return (
          <View
            key={tier}
            style={[
              styles.tierDot,
              { backgroundColor: earned ? TIER_COLORS[tier] : '#E5E7EB' },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── Progress bar ──

function ProgressBar({ count, threshold }: { count: number; threshold: number }) {
  const pct = Math.min(count / threshold, 1);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { flex: pct }]} />
      <View style={{ flex: 1 - pct }} />
    </View>
  );
}

// ── Single badge card ──

function BadgeCard({ progress }: { progress: BadgeProgress }) {
  const { badge, count, earnedTier, nextTier, earnedTiers } = progress;
  const maxTier = badge.tiers[badge.tiers.length - 1];
  const fullyCompleted = earnedTier === maxTier?.tier;

  return (
    <View style={[styles.card, fullyCompleted && styles.cardCompleted]}>
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{badge.icon}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeDesc}>{badge.description}</Text>
        </View>
        {earnedTier && (
          <View style={[styles.earnedPill, { backgroundColor: TIER_COLORS[earnedTier] + '33' }]}>
            <Text style={[styles.earnedPillText, { color: TIER_COLORS[earnedTier] }]}>
              {earnedTier.charAt(0).toUpperCase() + earnedTier.slice(1)}
            </Text>
          </View>
        )}
      </View>

      <TierDots tiers={badge.tiers} earnedTiers={earnedTiers} />

      {fullyCompleted ? (
        <View style={styles.completedRow}>
          <Text style={styles.completedText}>All tiers completed!</Text>
        </View>
      ) : nextTier ? (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              {nextTier.tier.charAt(0).toUpperCase() + nextTier.tier.slice(1)} — {count}/{nextTier.threshold}{' '}
              {badge.category ? badge.category.toLowerCase() + 's' : 'check-ins'}
            </Text>
            <Text style={styles.progressReward}>+{nextTier.points} pts</Text>
          </View>
          <ProgressBar count={count} threshold={nextTier.threshold} />
        </View>
      ) : null}
    </View>
  );
}

// ── Main screen ──

export default function ChallengesScreen() {
  const [progressList, setProgressList] = useState<BadgeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refreshing = false) => {
    if (!refreshing) setIsLoading(true);
    const data = await getBadgeProgress();
    setProgressList(data);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const earned = progressList.filter((p) => p.earnedTier !== null);
  const inProgress = progressList.filter((p) => p.earnedTier === null && p.nextTier !== null);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            load(true);
          }}
          tintColor="#0066CC"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>
          {earned.length} of {progressList.length} badges earned
        </Text>
      </View>

      {earned.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Earned</Text>
          {earned.map((p) => (
            <BadgeCard key={p.badge.id} progress={p} />
          ))}
        </>
      )}

      {inProgress.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>In Progress</Text>
          {inProgress.map((p) => (
            <BadgeCard key={p.badge.id} progress={p} />
          ))}
        </>
      )}

      {earned.length === 0 && inProgress.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏅</Text>
          <Text style={styles.emptyTitle}>No badges yet</Text>
          <Text style={styles.emptyText}>
            Start exploring St. Maarten and check in at locations to earn your first badge!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCompleted: {
    borderColor: '#FFD700',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: { fontSize: 32, marginRight: 12, lineHeight: 38 },
  cardMeta: { flex: 1 },
  badgeName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  badgeDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  earnedPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  earnedPillText: { fontSize: 12, fontWeight: '700' },
  tierDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressSection: { marginTop: 4 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, color: '#4B5563' },
  progressReward: { fontSize: 13, color: '#0066CC', fontWeight: '600' },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#0066CC',
    borderRadius: 4,
  },
  completedRow: { alignItems: 'center', paddingVertical: 4 },
  completedText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
