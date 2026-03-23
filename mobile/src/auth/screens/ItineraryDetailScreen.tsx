// FR-051: Mark itineraries as In Progress / Completed
// FR-052: Track progress through itinerary (X of Y locations visited)

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useItineraries } from '../hooks/useItineraries';
import type { ItineraryStatus } from '../types/itinerary.types';

const STATUS_LABELS: Record<ItineraryStatus, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_COLORS: Record<ItineraryStatus, string> = {
  planning: '#6B7280',
  in_progress: '#F59E0B',
  completed: '#059669',
};

const ItineraryDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const { currentItinerary, loading, fetchItineraryDetails, deleteItinerary, removeItem, updateItinerary } =
    useItineraries();

  useEffect(() => {
    fetchItineraryDetails(id);
  }, [id, fetchItineraryDetails]);

  const handleShare = async () => {
    if (!currentItinerary) return;
    try {
      await Share.share({
        message: `Check out my SXM itinerary: ${currentItinerary.name}\n${currentItinerary.description}`,
        url: `sxmgo://itinerary/${currentItinerary.id}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Itinerary', 'Are you sure you want to delete this itinerary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItinerary(id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSetStatus = async (status: ItineraryStatus) => {
    await updateItinerary(id, { status });
    await fetchItineraryDetails(id);
  };

  const items = currentItinerary?.items ?? [];
  const visitedCount = items.filter((i: any) => i.visited).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? visitedCount / totalCount : 0;
  const status: ItineraryStatus = (currentItinerary as any)?.status ?? 'planning';

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.itemCard, item.visited && styles.itemVisited]}>
      <View style={styles.itemNumber}>
        <Text style={styles.itemNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.locations.name}</Text>
        <Text style={styles.itemCategory}>{item.locations.category}</Text>
      </View>
      {item.visited ? (
        <View style={styles.visitedBadge}>
          <Text style={styles.visitedBadgeText}>✓ Visited</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => removeItem(id, item.id)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !currentItinerary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!currentItinerary) {
    return (
      <View style={styles.centered}>
        <Text>Itinerary not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>{currentItinerary.name}</Text>
              {currentItinerary.description ? (
                <Text style={styles.description}>{currentItinerary.description}</Text>
              ) : null}

              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
                  {STATUS_LABELS[status]}
                </Text>
              </View>

              {/* Progress bar (FR-052) */}
              {totalCount > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>
                      {visitedCount} of {totalCount} locations visited
                    </Text>
                    <Text style={styles.progressPct}>{Math.round(progressPct * 100)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { flex: progressPct }]} />
                    <View style={{ flex: Math.max(0, 1 - progressPct) }} />
                  </View>
                </View>
              )}

              {/* Status control buttons (FR-051) */}
              <View style={styles.statusRow}>
                {status === 'planning' && (
                  <TouchableOpacity
                    style={[styles.statusBtn, { borderColor: STATUS_COLORS.in_progress }]}
                    onPress={() => handleSetStatus('in_progress')}
                  >
                    <Text style={[styles.statusBtnText, { color: STATUS_COLORS.in_progress }]}>
                      Start
                    </Text>
                  </TouchableOpacity>
                )}
                {status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.statusBtn, { borderColor: STATUS_COLORS.completed }]}
                    onPress={() => handleSetStatus('completed')}
                  >
                    <Text style={[styles.statusBtnText, { color: STATUS_COLORS.completed }]}>
                      Mark Complete
                    </Text>
                  </TouchableOpacity>
                )}
                {status === 'completed' && (
                  <TouchableOpacity
                    style={[styles.statusBtn, { borderColor: STATUS_COLORS.planning }]}
                    onPress={() => handleSetStatus('planning')}
                  >
                    <Text style={[styles.statusBtnText, { color: STATUS_COLORS.planning }]}>
                      Reset
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Locations ({totalCount})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations added yet</Text>
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={() => navigation.navigate('MapTab')}
            >
              <Text style={styles.addMoreButtonText}>Explore Map to Add Locations</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  description: { fontSize: 15, color: '#4B5563', marginBottom: 14, lineHeight: 22 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  progressSection: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#4B5563' },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#0066CC' },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: '#0066CC', borderRadius: 4 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusBtnText: { fontSize: 14, fontWeight: '600' },
  shareBtn: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shareBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  deleteBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  listContent: { paddingBottom: 40 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemVisited: { borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemNumberText: { fontSize: 13, fontWeight: '700', color: '#0066CC' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  itemCategory: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  visitedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  visitedBadgeText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  removeButton: { padding: 8 },
  removeButtonText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', marginBottom: 20, fontSize: 15 },
  addMoreButton: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addMoreButtonText: { color: '#0066CC', fontWeight: '600' },
});

export default ItineraryDetailScreen;
