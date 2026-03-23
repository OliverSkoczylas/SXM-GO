import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useItineraries } from '../hooks/useItineraries';
import type { Itinerary } from '../types/itinerary.types';

const ItineraryListScreen = () => {
  const navigation = useNavigation<any>();
  const { itineraries, loading, fetchMyItineraries, fetchPublicItineraries } = useItineraries();
  const [tab, setTab] = useState<'my' | 'public'>('my');

  useEffect(() => {
    if (tab === 'my') {
      fetchMyItineraries();
    } else {
      fetchPublicItineraries();
    }
  }, [tab, fetchMyItineraries, fetchPublicItineraries]);

  const renderItem = ({ item }: { item: Itinerary }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ItineraryDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.is_public && (
          <View style={styles.publicBadge}>
            <Text style={styles.publicBadgeText}>Public</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
      <Text style={styles.cardDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'my' && styles.activeTab]}
          onPress={() => setTab('my')}
        >
          <Text style={[styles.tabText, tab === 'my' && styles.activeTabText]}>My Itineraries</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'public' && styles.activeTab]}
          onPress={() => setTab('public')}
        >
          <Text style={[styles.tabText, tab === 'public' && styles.activeTabText]}>Public</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
      ) : (
        <FlatList
          data={itineraries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No itineraries found</Text>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateItinerary')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#0066CC' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#0066CC' },
  listContent: { padding: 16, paddingBottom: 80 },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  publicBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  publicBadgeText: { fontSize: 10, color: '#0066CC', fontWeight: '700' },
  cardDescription: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  cardDate: { fontSize: 12, color: '#9CA3AF' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#6B7280' },
  loader: { marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0066CC',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontSize: 30, color: '#FFFFFF', fontWeight: '300' }
});

export default ItineraryListScreen;
