import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { getLeaderboard, LeaderboardType } from '../services/leaderboardService';
import { createGroup, joinGroup, getMyGroups, getGroupLeaderboardData, Group } from '../services/groupService';
import type { LeaderboardEntry } from '../types/auth.types';
import { useAuth } from '../hooks/useAuth';

export type ExtendedLeaderboardType = LeaderboardType | 'groups';

export default function LeaderboardScreen() {
  const { profile } = useAuth();
  const [leaderboardType, setLeaderboardType] = useState<ExtendedLeaderboardType>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const fetchLeaderboard = useCallback(async (type: ExtendedLeaderboardType, refreshing = false) => {
    if (!refreshing) setIsLoading(true);
    setError(null);

    if (type === 'groups') {
      const { data, error: groupError } = await getMyGroups();
      if (groupError) {
        setError('Failed to load your groups.');
      } else {
        setMyGroups(data || []);
      }
    } else {
      const { data, error: fetchError } = await getLeaderboard(type as LeaderboardType);
      if (fetchError) {
        setError('Failed to load leaderboard.');
      } else {
        setEntries(data || []);
      }
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  const fetchGroupLeaderboard = async (group: Group) => {
    setIsLoading(true);
    const { data, error: groupError } = await getGroupLeaderboardData(group.id);
    if (groupError) {
      Alert.alert('Error', 'Failed to load group leaderboard.');
    } else {
      setEntries(data || []);
      setSelectedGroup(group);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!selectedGroup) {
      fetchLeaderboard(leaderboardType);
    }
  }, [leaderboardType, fetchLeaderboard, selectedGroup]);

  const onRefresh = () => {
    setIsRefreshing(true);
    if (selectedGroup) {
      fetchGroupLeaderboard(selectedGroup);
    } else {
      fetchLeaderboard(leaderboardType, true);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    const { data, error: createError } = await createGroup(groupName.trim());
    if (createError) {
      Alert.alert('Error', 'Failed to create group.');
    } else {
      setGroupName('');
      setShowGroupModal(false);
      fetchLeaderboard('groups');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    const { error: joinError } = await joinGroup(inviteCode.trim());
    if (joinError) {
      Alert.alert('Error', 'Invalid invite code or already a member.');
    } else {
      setInviteCode('');
      setShowGroupModal(false);
      fetchLeaderboard('groups');
    }
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user_id === profile?.id;
    return (
      <View style={[styles.itemContainer, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, item.rank <= 3 && styles.topRankText]}>{item.rank}</Text>
        </View>
        <Image
          source={item.avatar_url ? { uri: item.avatar_url } : require('../../../android/app/src/main/res/mipmap-xhdpi/ic_launcher.png')}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserName]} numberOfLines={1}>
            {item.display_name || 'Anonymous Traveler'}
          </Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>{item.points.toLocaleString()}</Text>
          <Text style={styles.ptsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupCard} onPress={() => fetchGroupLeaderboard(item)}>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.inviteCode}>Code: {item.invite_code}</Text>
      </View>
      <Text style={styles.viewText}>View > </Text>
    </TouchableOpacity>
  );

  const TabButton = ({ type, label }: { type: ExtendedLeaderboardType; label: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, leaderboardType === type && styles.activeTabButton]}
      onPress={() => {
        setLeaderboardType(type);
        setSelectedGroup(null);
      }}
    >
      <Text style={[styles.tabButtonText, leaderboardType === type && styles.activeTabButtonText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {selectedGroup && (
            <TouchableOpacity onPress={() => setSelectedGroup(null)} style={styles.backButton}>
              <Text style={styles.backText}>{'< Back'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{selectedGroup ? selectedGroup.name : 'Leaderboard'}</Text>
        </View>
        {!selectedGroup && (
          <View style={styles.tabBar}>
            <TabButton type="global" label="Global" />
            <TabButton type="weekly" label="Weekly" />
            <TabButton type="groups" label="Groups" />
          </View>
        )}
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0066CC" /></View>
      ) : leaderboardType === 'groups' && !selectedGroup ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={myGroups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>You haven't joined any groups yet.</Text></View>}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0066CC" />}
          />
          <TouchableOpacity style={styles.fab} onPress={() => setShowGroupModal(true)}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {error && <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>}
          <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.user_id}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0066CC" />}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No rankings available.</Text></View>}
          />
        </View>
      )}

      <Modal visible={showGroupModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join or Create Group</Text>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Join with Invite Code</Text>
              <TextInput style={styles.modalInput} value={inviteCode} onChangeText={setInviteCode} placeholder="CODE12" autoCapitalize="characters" />
              <TouchableOpacity style={styles.modalButton} onPress={handleJoinGroup}><Text style={styles.buttonText}>Join Group</Text></TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Create New Group</Text>
              <TextInput style={styles.modalInput} value={groupName} onChangeText={setGroupName} placeholder="Travel Squad" />
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#10B981' }]} onPress={handleCreateGroup}><Text style={styles.buttonText}>Create Group</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowGroupModal(false)}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { backgroundColor: '#FFFFFF', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12 },
  backText: { color: '#0066CC', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  tabBar: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginTop: 16 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabButtonText: { color: '#0066CC' },
  listContent: { paddingVertical: 12 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  currentUserItem: { borderColor: '#0066CC', borderWidth: 1, backgroundColor: '#F0F7FF' },
  rankContainer: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  topRankText: { color: '#F59E0B', fontSize: 18, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  currentUserName: { color: '#0066CC' },
  pointsContainer: { alignItems: 'flex-end' },
  pointsText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  ptsLabel: { fontSize: 12, color: '#6B7280' },
  errorText: { color: '#DC2626', textAlign: 'center', marginBottom: 16 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 16 },
  groupCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  inviteCode: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  viewText: { color: '#0066CC', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0066CC', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  modalSection: { marginVertical: 10 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1A1A1A', marginBottom: 12 },
  modalButton: { backgroundColor: '#0066CC', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  modalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  closeButton: { marginTop: 20, alignItems: 'center' },
  closeText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
});
