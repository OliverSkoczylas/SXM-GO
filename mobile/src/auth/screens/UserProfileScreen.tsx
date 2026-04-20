// Public user profile screen
// Shows another user's profile with relationship management actions.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import {
  getPublicProfile,
  getFriendRequestStatus,
  getSentRequests,
  sendFriendRequest,
  cancelFriendRequest,
  removeFriend,
  acceptFriendRequest,
  getPendingRequests,
  type PublicProfile,
} from '../services/socialService';

// ── Types ──────────────────────────────────────────────────────────────────

type RelationshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

type Props = NativeStackScreenProps<ProfileStackParamList, 'UserProfile'>;

// ── Avatar placeholder ─────────────────────────────────────────────────────

function AvatarView({
  uri,
  name,
  size,
}: {
  uri: string | null | undefined;
  name: string;
  size: number;
}) {
  const initial = (name ?? '?')[0].toUpperCase();
  const circleStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, circleStyle]} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, circleStyle]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [relationship, setRelationship] = useState<RelationshipStatus>('none');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const [profileRes, relStatus] = await Promise.all([
      getPublicProfile(userId),
      getFriendRequestStatus(currentUserId, userId),
    ]);

    if (profileRes.error || !profileRes.data) {
      setLoadError('Could not load this profile.');
      setIsLoading(false);
      return;
    }

    setProfile(profileRes.data);
    setRelationship(relStatus);

    // If we have a pending_received status, we need the request id to accept it
    if (relStatus === 'pending_received') {
      const { data: reqs } = await getPendingRequests(currentUserId);
      const req = (reqs ?? []).find(r => r.sender_id === userId);
      if (req) setPendingRequestId(req.id);
    }

    // If we sent a request, fetch the request id for cancellation
    if (relStatus === 'pending_sent') {
      const { data: sentReqs } = await getSentRequests(currentUserId);
      const sentReq = (sentReqs ?? []).find(r => r.receiver_id === userId);
      if (sentReq) setPendingRequestId(sentReq.id);
    }

    setIsLoading(false);
  }, [userId, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Relationship actions ──────────────────────────────────────────────

  const handleAddFriend = async () => {
    setIsActionLoading(true);
    setRelationship('pending_sent');
    const { error } = await sendFriendRequest(currentUserId, userId);
    if (error) {
      setRelationship('none');
      Alert.alert('Error', 'Could not send friend request. Please try again.');
    } else {
      // Fetch the newly created request id so we can cancel it later
      const { data: sentReqs } = await getSentRequests(currentUserId);
      const sentReq = (sentReqs ?? []).find(r => r.receiver_id === userId);
      if (sentReq) setPendingRequestId(sentReq.id);
    }
    setIsActionLoading(false);
  };

  const handleCancelRequest = async () => {
    if (!pendingRequestId) return;
    setIsActionLoading(true);
    setRelationship('none');
    const { error } = await cancelFriendRequest(pendingRequestId);
    if (error) {
      setRelationship('pending_sent');
      Alert.alert('Error', 'Could not cancel the request. Please try again.');
    } else {
      setPendingRequestId(null);
    }
    setIsActionLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!pendingRequestId) return;
    setIsActionLoading(true);
    setRelationship('friends');
    const { error } = await acceptFriendRequest(pendingRequestId, userId, currentUserId);
    if (error) {
      setRelationship('pending_received');
      Alert.alert('Error', 'Could not accept the request. Please try again.');
    } else {
      setPendingRequestId(null);
    }
    setIsActionLoading(false);
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Remove ${profile?.display_name ?? 'this user'} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            setRelationship('none');
            const { error } = await removeFriend(currentUserId, userId);
            if (error) {
              setRelationship('friends');
              Alert.alert('Error', 'Could not remove friend. Please try again.');
            }
            setIsActionLoading(false);
          },
        },
      ],
    );
  };

  // ── Loading / error states ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (loadError || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>{loadError ?? 'Profile not found'}</Text>
        <Text style={styles.errorSub}>This profile may be private or no longer exist.</Text>
      </View>
    );
  }

  // ── Relationship button ────────────────────────────────────────────────

  function RelationshipButton() {
    if (isActionLoading) {
      return (
        <View style={[styles.relationshipButton, styles.buttonLoading]}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }

    if (relationship === 'none') {
      return (
        <TouchableOpacity
          style={styles.relationshipButton}
          onPress={handleAddFriend}
          activeOpacity={0.8}
        >
          <Text style={styles.relationshipButtonText}>Add Friend</Text>
        </TouchableOpacity>
      );
    }

    if (relationship === 'pending_sent') {
      return (
        <TouchableOpacity
          style={[styles.relationshipButton, styles.pendingButton]}
          onPress={handleCancelRequest}
          activeOpacity={0.8}
        >
          <Text style={[styles.relationshipButtonText, styles.pendingButtonText]}>
            Pending — Cancel
          </Text>
        </TouchableOpacity>
      );
    }

    if (relationship === 'pending_received') {
      return (
        <TouchableOpacity
          style={[styles.relationshipButton, styles.acceptButton]}
          onPress={handleAcceptRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.relationshipButtonText}>Accept Request</Text>
        </TouchableOpacity>
      );
    }

    // friends
    return (
      <TouchableOpacity
        style={[styles.relationshipButton, styles.friendsButton]}
        onPress={handleRemoveFriend}
        activeOpacity={0.8}
      >
        <Text style={[styles.relationshipButtonText, styles.friendsButtonText]}>
          ✓ Friends — Remove
        </Text>
      </TouchableOpacity>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* 1. Avatar */}
      <View style={styles.avatarSection}>
        <AvatarView uri={profile.avatar_url} name={profile.display_name} size={80} />
        <Text style={styles.displayName}>{profile.display_name}</Text>
      </View>

      {/* 2. Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.total_points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.visit_count}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
      </View>

      {/* 3. Relationship button */}
      <View style={styles.actionSection}>
        <RelationshipButton />
      </View>

      {/* 4. Achievements */}
      {profile.achievements && profile.achievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgeRow}>
            {profile.achievements.map((badge, i) => (
              <View key={i} style={styles.achievementBadge}>
                <Text style={styles.achievementBadgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },

  // Error
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  avatar: {
    marginBottom: 14,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarInitial: {
    fontWeight: '800',
    color: '#0EA5E9',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Relationship button
  actionSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  relationshipButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  relationshipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingButton: {
    backgroundColor: '#F1F5F9',
  },
  pendingButtonText: {
    color: '#64748B',
  },
  acceptButton: {
    backgroundColor: '#059669',
  },
  friendsButton: {
    backgroundColor: '#F1F5F9',
  },
  friendsButtonText: {
    color: '#0F172A',
  },

  // Achievements section
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    backgroundColor: '#EBF5FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  achievementBadgeText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '500',
  },
});
