// Location detail screen
// Displays full info for a single location: photos, stats, description,
// contact info, directions, and check-in action.

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
  Linking,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../navigation/AppNavigator';
import { getSupabaseClient } from '../services/supabaseClient';
import { checkIn } from '../services/locationService';
import { openDirections } from '../services/directionsService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../../shared/components/Toast';

// ── Types ──────────────────────────────────────────────────────────────────

interface LocationDetail {
  id: string;
  name: string;
  category: string;
  points: number;
  latitude: number;
  longitude: number;
  description: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  photos: string[] | null;
  avg_rating: number | null;
  rating_count: number | null;
}

// ── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; emoji: string; bg: string }> = {
  Beach:         { color: '#0EA5E9', emoji: '\u{1F3D6}',  bg: '#E0F2FE' },
  Restaurant:    { color: '#F97316', emoji: '\u{1F37D}',  bg: '#FFF7ED' },
  Casino:        { color: '#EF4444', emoji: '\u{1F3B0}',  bg: '#FEF2F2' },
  Attraction:    { color: '#8B5CF6', emoji: '\u{1F3DB}',  bg: '#F5F3FF' },
  Shopping:      { color: '#EC4899', emoji: '\u{1F6CD}',  bg: '#FDF2F8' },
  Entertainment: { color: '#10B981', emoji: '\u{1F3B6}',  bg: '#ECFDF5' },
};

// ── Screen ─────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<MapStackParamList, 'LocationDetail'>;

export default function LocationDetailScreen({ route, navigation }: Props) {
  const { locationId } = route.params;
  const { user } = useAuth();

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [visited, setVisited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchLocation = useCallback(async () => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      Alert.alert('Error', 'Could not load location details.');
      navigation.goBack();
      return;
    }

    setLocation(data as LocationDetail);

    // Check visited status for current user
    if (user?.id) {
      const { data: checkInRow } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('location_id', locationId)
        .limit(1)
        .maybeSingle();

      setVisited(!!checkInRow);
    }

    setIsLoading(false);
  }, [locationId, user?.id, navigation]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // ── Actions ────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    if (!location || visited) return;

    setIsCheckingIn(true);
    const result = await checkIn({
      id: location.id,
      name: location.name,
      description: location.description ?? '',
      category: location.category as any,
      latitude: location.latitude,
      longitude: location.longitude,
      points: location.points,
      visited,
    });
    setIsCheckingIn(false);

    if (result.error) {
      setToast({ visible: true, message: result.error.message || 'Check-in failed.', type: 'error' });
      return;
    }

    setVisited(true);
    const msg = result.flagged
      ? `+${location.points} pts (under review)`
      : result.offline
        ? `+${location.points} pts queued for sync!`
        : `+${location.points} pts earned!`;
    setToast({ visible: true, message: msg, type: 'success' });
  };

  const handleDirections = () => {
    if (!location) return;
    openDirections(location.latitude, location.longitude, location.name);
  };

  const handlePhone = () => {
    if (!location?.phone) return;
    const url = `tel:${location.phone.replace(/\s/g, '')}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open the phone app.'),
    );
  };

  const handleWebsite = () => {
    if (!location?.website) return;
    const url = location.website.startsWith('http')
      ? location.website
      : `https://${location.website}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open the website.'),
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!location) return null;

  const cfg = CATEGORY_CONFIG[location.category] ?? { color: '#6B7280', emoji: '\u{1F4CD}', bg: '#F9FAFB' };
  const heroPhoto = location.photos?.[0] ?? null;
  const rating = location.avg_rating ? location.avg_rating.toFixed(1) : null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. Header image / color banner */}
        {heroPhoto ? (
          <Image source={{ uri: heroPhoto }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroBanner, { backgroundColor: cfg.bg }]}>
            <Text style={styles.heroBannerEmoji}>{cfg.emoji}</Text>
          </View>
        )}

        <View style={styles.body}>

          {/* 2. Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.locationName}>{location.name}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.categoryBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: cfg.color }]}>
                  {cfg.emoji}  {location.category}
                </Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>{location.points} pts</Text>
              </View>
            </View>
          </View>

          {/* 3. Stats row */}
          <View style={styles.statsRow}>
            {rating !== null && (
              <Text style={styles.rating}>
                ★ {rating}
                <Text style={styles.ratingCount}>  ({location.rating_count ?? 0} reviews)</Text>
              </Text>
            )}
            {visited && (
              <View style={styles.visitedBadge}>
                <Text style={styles.visitedBadgeText}>✓ Visited</Text>
              </View>
            )}
          </View>

          {/* 4. Description */}
          {location.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{location.description}</Text>
            </View>
          ) : null}

          {/* 5. Info section */}
          {(location.hours || location.phone || location.website) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Info</Text>

              {location.hours ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🕐</Text>
                  <Text style={styles.infoText}>{location.hours}</Text>
                </View>
              ) : null}

              {location.phone ? (
                <TouchableOpacity style={styles.infoRow} onPress={handlePhone} activeOpacity={0.7}>
                  <Text style={styles.infoIcon}>📞</Text>
                  <Text style={[styles.infoText, styles.infoLink]}>{location.phone}</Text>
                </TouchableOpacity>
              ) : null}

              {location.website ? (
                <TouchableOpacity style={styles.infoRow} onPress={handleWebsite} activeOpacity={0.7}>
                  <Text style={styles.infoIcon}>🌐</Text>
                  <Text style={[styles.infoText, styles.infoLink]} numberOfLines={1}>
                    {location.website}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* 6. Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleDirections}
              activeOpacity={0.8}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checkInButton,
                visited && styles.checkInButtonVisited,
                isCheckingIn && styles.checkInButtonLoading,
              ]}
              onPress={handleCheckIn}
              disabled={visited || isCheckingIn}
              activeOpacity={0.8}
            >
              {isCheckingIn ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.checkInButtonText, visited && styles.checkInButtonTextVisited]}>
                  {visited ? '✓ Visited' : 'Check In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Hero
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroBanner: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBannerEmoji: {
    fontSize: 64,
  },

  // Body
  body: {
    padding: 20,
  },

  // Title row
  titleRow: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pointsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  rating: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
  },
  ratingCount: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
  },
  visitedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visitedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 23,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  infoLink: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  directionsButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  directionsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkInButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  checkInButtonVisited: {
    backgroundColor: '#F1F5F9',
  },
  checkInButtonLoading: {
    opacity: 0.7,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkInButtonTextVisited: {
    color: '#94A3B8',
  },
});
