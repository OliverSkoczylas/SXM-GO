import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { LeaderboardEntry } from '../services/leaderboardService';
import LeaderboardListItem from './LeaderboardListItem';
import { useAuth } from '../../auth/hooks/useAuth';

interface LeaderboardListProps {
  data: LeaderboardEntry[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ data, loading, error, onRefresh }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  if (loading && data.length === 0) {
    return <ActivityIndicator size="large" color="#0066CC" style={styles.centered} />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load leaderboard.</Text>
        <Text style={styles.errorText}>Please try again later.</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No one is on the leaderboard yet. Be the first!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <LeaderboardListItem
          item={item}
          isCurrentUser={item.id === currentUserId}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          colors={['#0066CC']}
          tintColor={'#0066CC'}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
});

export default LeaderboardList;
