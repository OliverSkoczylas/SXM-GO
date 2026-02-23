import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LeaderboardEntry } from '../services/leaderboardService';

interface LeaderboardListItemProps {
  item: LeaderboardEntry;
  isCurrentUser: boolean;
}

const LeaderboardListItem: React.FC<LeaderboardListItemProps> = ({ item, isCurrentUser }) => {
  const containerStyle = [
    styles.container,
    isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
  ];

  const rankColor = isCurrentUser ? styles.currentUserText : styles.otherUserText;

  return (
    <View style={containerStyle}>
      <Text style={[styles.rank, rankColor]}>{item.rank}</Text>
      {item.avatarUrl ? (
        <Image
          source={{ uri: item.avatarUrl }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {(item.displayName || 'A').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.displayName, rankColor]} numberOfLines={1}>
          {item.displayName || 'Anonymous'}
        </Text>
        <Text style={[styles.points, rankColor]}>{item.totalPoints.toLocaleString()} points</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  currentUserContainer: {
    backgroundColor: '#0066CC',
    borderColor: '#0052A3',
  },
  otherUserContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1F2937',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#4B5563',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  points: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default LeaderboardListItem;
