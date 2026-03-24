import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useChallenges } from '../hooks/useChallenges';
import { ChallengeWithProgress } from '../types/challenge.types';
import { ChallengeIcon } from '../components/ChallengeIcons';

export default function ChallengesScreen() {
  const { challenges, isLoading, refresh } = useChallenges();

  const renderChallenge = ({ item }: { item: ChallengeWithProgress }) => {
    const progress = item.progress.currentCount / item.requirementCount;
    const isCompleted = item.progress.isCompleted;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, isCompleted && styles.completedIcon]}>
            <ChallengeIcon name={item.iconName} color={isCompleted ? '#FFFFFF' : '#4B5563'} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.challengeName}>{item.name}</Text>
            <Text style={styles.challengeDescription}>{item.description}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>+{item.pointsReward}</Text>
            <Text style={styles.ptsLabel}>pts</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {item.progress.currentCount} / {item.requirementCount}
            </Text>
            {isCompleted && <Text style={styles.completedText}>Completed!</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallenge}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#0066CC" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No challenges available at the moment.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: '#10B981',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
  },
  ptsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressSection: {
    marginTop: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
});
