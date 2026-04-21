import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useItineraries } from '../hooks/useItineraries';
import type { Itinerary } from '../types/itinerary.types';

// ── Featured tour metadata ───────────────────────────────────────────────────
const FEATURED_META: Record<string, { emoji: string; accent: string; tagline: string }> = {
  'Foodie Tour': {
    emoji: '🍽️',
    accent: '#F59E0B',
    tagline: '5 stops · Restaurants & cocktail bars',
  },
  'Beach Hopper': {
    emoji: '🏖️',
    accent: '#0EA5E9',
    tagline: '5 stops · Dutch & French-side beaches',
  },
  'Cultural Explorer': {
    emoji: '🏛️',
    accent: '#8B5CF6',
    tagline: '5 stops · History, art & local spirit',
  },
};

// ── Memoised card components ──────────────────────────────────────────────────
const FeaturedCard = React.memo(
  ({ item, onPress }: { item: Itinerary; onPress: (id: string) => void }) => {
    const meta = FEATURED_META[item.name] ?? {
      emoji: '⭐',
      accent: '#0066CC',
      tagline: item.difficulty,
    };

    return (
      <TouchableOpacity
        style={[styles.featuredCard, { borderLeftColor: meta.accent }]}
        onPress={() => onPress(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.featuredCardTop}>
          <Text style={styles.featuredEmoji}>{meta.emoji}</Text>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
          </View>
        </View>
        <Text style={styles.featuredTitle}>{item.name}</Text>
        <Text style={styles.featuredTagline}>{meta.tagline}</Text>
        <Text style={styles.featuredDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.featuredFooter}>
          <View style={[styles.difficultyPill, { backgroundColor: meta.accent + '22' }]}>
            <Text style={[styles.difficultyText, { color: meta.accent }]}>
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
            </Text>
          </View>
          <Text style={styles.featuredCta}>View route →</Text>
        </View>
      </TouchableOpacity>
    );
  },
);

const ItineraryCard = React.memo(
  ({ item, onPress }: { item: Itinerary; onPress: (id: string) => void }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item.id)}
      activeOpacity={0.85}
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
  ),
);

// ── Screen ────────────────────────────────────────────────────────────────────
type Tab = 'featured' | 'my' | 'public';

const ItineraryListScreen = () => {
  const navigation = useNavigation<any>();
  const {
    itineraries,
    loading,
    fetchFeaturedItineraries,
    fetchMyItineraries,
    fetchPublicItineraries,
  } = useItineraries();
  const [tab, setTab] = React.useState<Tab>('featured');

  useEffect(() => {
    if (tab === 'featured') {
      fetchFeaturedItineraries();
    } else if (tab === 'my') {
      fetchMyItineraries();
    } else {
      fetchPublicItineraries();
    }
  }, [tab, fetchFeaturedItineraries, fetchMyItineraries, fetchPublicItineraries]);

  const handlePress = useCallback(
    (id: string) => navigation.navigate('ItineraryDetail', { id }),
    [navigation],
  );

  const renderFeatured = useCallback(
    ({ item }: { item: Itinerary }) => (
      <FeaturedCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const renderItem = useCallback(
    ({ item }: { item: Itinerary }) => (
      <ItineraryCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'featured', label: '⭐ Featured' },
    { key: 'my',       label: 'Mine' },
    { key: 'public',   label: 'Public' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabContainer}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.activeTab]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.activeTabText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
      ) : (
        <FlatList
          data={itineraries}
          renderItem={tab === 'featured' ? renderFeatured : renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            tab === 'featured' ? (
              <Text style={styles.sectionHeader}>
                Curated tours — ready to explore
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {tab === 'my'
                ? 'No itineraries yet — create your first!'
                : 'No itineraries found'}
            </Text>
          }
        />
      )}

      {/* FAB: only show on non-featured tabs */}
      {tab !== 'featured' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateItinerary')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ItineraryListScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Tab bar
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#0066CC' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#0066CC' },

  // List
  listContent: { padding: 16, paddingBottom: 90 },
  sectionHeader: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  loader: { marginTop: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#6B7280' },

  // Featured card
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  featuredCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredEmoji: { fontSize: 32 },
  featuredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: { fontSize: 11, color: '#92400E', fontWeight: '700' },
  featuredTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  featuredTagline: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 8 },
  featuredDesc: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  difficultyPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  difficultyText: { fontSize: 12, fontWeight: '700' },
  featuredCta: { fontSize: 13, color: '#0066CC', fontWeight: '600' },

  // Regular card
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  publicBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publicBadgeText: { fontSize: 10, color: '#0066CC', fontWeight: '700' },
  cardDescription: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  cardDate: { fontSize: 12, color: '#9CA3AF' },

  // FAB
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
  fabText: { fontSize: 30, color: '#FFFFFF', fontWeight: '300' },
});
