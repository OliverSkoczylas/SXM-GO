// Friends management screen
// Tabs: Friends | Requests | Find People

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendRequestStatus,
  type Friend,
  type FriendRequest,
  type PublicProfile,
} from '../services/socialService';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'friends' | 'requests' | 'find';

type RelationshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

interface SearchResultItem extends PublicProfile {
  relationship: RelationshipStatus;
  pendingRequestId?: string;
}

type Props = NativeStackScreenProps<ProfileStackParamList, 'Friends'>;

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
  const avatarStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, avatarStyle]} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, avatarStyle]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function FriendsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('friends');

  // Friends tab
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  // Requests tab
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);

  // Find People tab
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadFriends = useCallback(async () => {
    if (!currentUserId) return;
    setIsFriendsLoading(true);
    const { data } = await getFriends(currentUserId);
    setFriends(data ?? []);
    setIsFriendsLoading(false);
  }, [currentUserId]);

  const loadRequests = useCallback(async () => {
    if (!currentUserId) return;
    setIsRequestsLoading(true);
    const [pendingRes, sentRes] = await Promise.all([
      getPendingRequests(currentUserId),
      getSentRequests(currentUserId),
    ]);
    setReceivedRequests(pendingRes.data ?? []);
    setSentRequests(sentRes.data ?? []);
    setIsRequestsLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    if (activeTab === 'friends') loadFriends();
    else if (activeTab === 'requests') loadRequests();
  }, [activeTab, loadFriends, loadRequests]);

  // ── Search with debounce ──────────────────────────────────────────────────

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearchLoading(true);
      const { data } = await searchUsers(q.trim(), currentUserId);
      if (!data) {
        setSearchResults([]);
        setIsSearchLoading(false);
        return;
      }
      // Fetch relationship status for each result
      const enriched: SearchResultItem[] = await Promise.all(
        data.map(async (profile) => {
          const rel = await getFriendRequestStatus(currentUserId, profile.id);
          return { ...profile, relationship: rel };
        }),
      );
      setSearchResults(enriched);
      setIsSearchLoading(false);
    },
    [currentUserId],
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  };

  // ── Friend actions ────────────────────────────────────────────────────────

  const handleRemoveFriend = (friend: Friend) => {
    const name = friend.friend_profile?.display_name ?? 'this person';
    Alert.alert(
      'Remove Friend',
      `Remove ${name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(currentUserId, friend.friend_id);
            loadFriends();
          },
        },
      ],
    );
  };

  const handleAccept = async (req: FriendRequest) => {
    await acceptFriendRequest(req.id, req.sender_id, req.receiver_id);
    loadRequests();
    loadFriends();
  };

  const handleDecline = async (req: FriendRequest) => {
    await declineFriendRequest(req.id);
    loadRequests();
  };

  const handleCancelSent = async (req: FriendRequest) => {
    await cancelFriendRequest(req.id);
    loadRequests();
  };

  const handleAddFriend = async (profile: SearchResultItem) => {
    const updated = searchResults.map(r =>
      r.id === profile.id ? { ...r, relationship: 'pending_sent' as RelationshipStatus } : r,
    );
    setSearchResults(updated);
    const { error } = await sendFriendRequest(currentUserId, profile.id);
    if (error) {
      // Revert optimistic update
      setSearchResults(searchResults);
    }
  };

  // ── Render items ──────────────────────────────────────────────────────────

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const profile = item.friend_profile;
    const name = profile?.display_name ?? 'Unknown';
    return (
      <View style={styles.rowCard}>
        <AvatarView uri={profile?.avatar_url} name={name} size={44} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{name}</Text>
          <Text style={styles.rowSub}>{profile?.total_points ?? 0} pts</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFriend(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReceivedRequestItem = ({ item }: { item: FriendRequest }) => {
    const name = item.sender?.display_name ?? 'Unknown';
    return (
      <View style={styles.rowCard}>
        <AvatarView uri={item.sender?.avatar_url} name={name} size={44} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{name}</Text>
          <Text style={styles.rowSub}>Wants to be friends</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDecline(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.rowCard}>
      <View style={[styles.avatarPlaceholder, styles.avatarSm]}>
        <Text style={styles.avatarInitialSm}>?</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>Pending</Text>
        <Text style={styles.rowSub}>Request sent</Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => handleCancelSent(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchItem = ({ item }: { item: SearchResultItem }) => {
    const rel = item.relationship;
    return (
      <TouchableOpacity
        style={styles.rowCard}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        activeOpacity={0.7}
      >
        <AvatarView uri={item.avatar_url} name={item.display_name} size={44} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.display_name}</Text>
          <Text style={styles.rowSub}>{item.total_points} pts</Text>
        </View>
        {rel === 'none' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddFriend(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
        {rel === 'pending_sent' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        )}
        {rel === 'friends' && (
          <View style={styles.friendsBadge}>
            <Text style={styles.friendsBadgeText}>Friends</Text>
          </View>
        )}
        {rel === 'pending_received' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Requested you</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Tab renders ────────────────────────────────────────────────────────────

  const pendingCount = receivedRequests.length;

  function renderFriendsTab() {
    if (isFriendsLoading) {
      return <ActivityIndicator style={styles.centered} size="large" color="#0066CC" />;
    }
    return (
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderFriendItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No friends yet. Find people to connect with!</Text>
          </View>
        }
      />
    );
  }

  function renderRequestsTab() {
    if (isRequestsLoading) {
      return <ActivityIndicator style={styles.centered} size="large" color="#0066CC" />;
    }
    return (
      <FlatList
        data={[...receivedRequests, ...sentRequests]}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          if (index < receivedRequests.length) {
            return renderReceivedRequestItem({ item });
          }
          return renderSentRequestItem({ item });
        }}
        ListHeaderComponent={
          <>
            {receivedRequests.length > 0 && (
              <Text style={styles.subSectionHeader}>Received</Text>
            )}
            {receivedRequests.length === 0 && sentRequests.length === 0 && null}
          </>
        }
        ListFooterComponent={
          sentRequests.length > 0 ? (
            <Text style={styles.subSectionHeader}>Sent</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📬</Text>
            <Text style={styles.emptyText}>No pending requests.</Text>
          </View>
        }
      />
    );
  }

  function renderFindTab() {
    return (
      <View style={styles.findContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {isSearchLoading && (
            <ActivityIndicator size="small" color="#0066CC" style={styles.searchSpinner} />
          )}
        </View>
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          renderItem={renderSearchItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery.length > 0 && !isSearchLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔎</Text>
                <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'friends' && styles.tabItemActive]}
          onPress={() => setActiveTab('friends')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === 'friends' && styles.tabLabelActive]}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.7}
        >
          <View style={styles.tabLabelRow}>
            <Text style={[styles.tabLabel, activeTab === 'requests' && styles.tabLabelActive]}>
              Requests
            </Text>
            {pendingCount > 0 && activeTab !== 'requests' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'find' && styles.tabItemActive]}
          onPress={() => setActiveTab('find')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === 'find' && styles.tabLabelActive]}>
            Find People
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'friends' && renderFriendsTab()}
        {activeTab === 'requests' && renderRequestsTab()}
        {activeTab === 'find' && renderFindTab()}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0066CC',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#0066CC',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Badge on tab
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  tabContent: {
    flex: 1,
  },

  // Row cards
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Avatar
  avatar: {
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSm: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitial: {
    fontWeight: '700',
    color: '#0EA5E9',
  },
  avatarInitialSm: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0EA5E9',
  },

  // Buttons
  removeButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  addButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  friendsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  friendsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

  // Section sub-headers in requests list
  subSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },

  // Find People tab
  findContainer: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: '#0F172A',
  },
  searchSpinner: {
    marginLeft: 8,
  },

  // Empty states
  centered: {
    marginTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 22,
  },
});
