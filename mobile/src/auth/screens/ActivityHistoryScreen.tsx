// Activity history screen
// Displays a paginated list of past activities for the current user.

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import {
  getActivityHistory,
  formatDuration,
  formatPace,
  type Activity,
} from '../services/activityTrackingService';

// ── Types ──

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ActivityHistory'>;

// ── Helpers ──

function formatActivityDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' · ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Stat cell ──

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Activity card ──

interface ActivityCardProps {
  activity: Activity;
  onPress: (id: string) => void;
}

const ActivityCard = memo(function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const checkInCount = activity.check_in_ids.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(activity.id)}
      activeOpacity={0.75}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{formatActivityDate(activity.started_at)}</Text>
        {checkInCount > 0 && (
          <Text style={styles.checkInBadge}>
            {checkInCount} {checkInCount === 1 ? 'check-in' : 'check-ins'}
          </Text>
        )}
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{activity.title ?? 'Activity'}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCell
          value={`${activity.distance_km.toFixed(1)} km`}
          label="Distance"
        />
        <View style={styles.statDivider} />
        <StatCell
          value={formatDuration(activity.duration_seconds)}
          label="Duration"
        />
        <View style={styles.statDivider} />
        <StatCell
          value={formatPace(activity.avg_pace_min_per_km)}
          label="Avg pace"
        />
      </View>
    </TouchableOpacity>
  );
});

// ── Empty state ──

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No activities yet. Start exploring with the 🏃 button on the map!
      </Text>
    </View>
  );
}

// ── Main screen ──

export default function ActivityHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (!isRefresh) setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getActivityHistory(user.id, 30);

    if (fetchError) {
      setError('Failed to load activities. Please try again.');
    } else {
      setActivities(data ?? []);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities(true);
  }, [fetchActivities]);

  const handleCardPress = useCallback((activityId: string) => {
    navigation.navigate('ActivityDetail', { activityId });
  }, [navigation]);

  const keyExtractor = useCallback((item: Activity) => item.id, []);

  const renderItem = useCallback(({ item }: { item: Activity }) => (
    <ActivityCard activity={item} onPress={handleCardPress} />
  ), [handleCardPress]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchActivities()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.listContent,
        activities.length === 0 && styles.listContentEmpty,
      ]}
      ListEmptyComponent={EmptyState}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#0066CC"
          colors={['#0066CC']}
        />
      }
    />
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkInBadge: {
    fontSize: 11,
    color: '#0066CC',
    fontWeight: '600',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
