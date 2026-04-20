// Activity detail screen
// Full breakdown of a single activity including route map, stats, and delete action.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import {
  getActivity,
  deleteActivity,
  formatDuration,
  formatPace,
  type Activity,
  type RoutePoint,
} from '../services/activityTrackingService';

// ── Types ──

type Props = NativeStackScreenProps<ProfileStackParamList, 'ActivityDetail'>;
type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ActivityDetail'>;

// ── Helpers ──

function formatDateLong(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Leaflet HTML builder ──

function buildMapHtml(routePoints: RoutePoint[]): string {
  const pointsJson = JSON.stringify(
    routePoints.map(p => [p.lat, p.lng])
  );

  const singlePoint = routePoints.length === 1
    ? `L.marker([${routePoints[0].lat}, ${routePoints[0].lng}]).addTo(map);`
    : '';

  const polyline = routePoints.length > 1
    ? `var line = L.polyline(points, { color: '#CC2200', weight: 4, opacity: 0.85 }).addTo(map);
       map.fitBounds(line.getBounds(), { padding: [20, 20] });`
    : routePoints.length === 1
    ? `map.setView([${routePoints[0].lat}, ${routePoints[0].lng}], 15);`
    : `map.setView([18.0708, -63.0501], 12);`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    var points = ${pointsJson};
    ${singlePoint}
    ${polyline}
  </script>
</body>
</html>`;
}

// ── Stat box ──

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxValue}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

// ── Section card ──

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ── Main screen ──

export default function ActivityDetailScreen({ route }: Props) {
  const navigation = useNavigation<Nav>();
  const { activityId } = route.params;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await getActivity(activityId);
      if (cancelled) return;
      if (fetchError || !data) {
        setError('Could not load activity. Please go back and try again.');
      } else {
        setActivity(data);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [activityId]);

  // Memoize the HTML string so it is only rebuilt when route_points change.
  const mapHtml = useMemo(
    () => (activity ? buildMapHtml(activity.route_points) : ''),
    [activity?.route_points] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to permanently delete this activity? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error: deleteError } = await deleteActivity(activityId);
            setDeleting(false);
            if (deleteError) {
              Alert.alert('Error', 'Failed to delete activity. Please try again.');
            } else {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [activityId, navigation]);

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  // ── Error ──
  if (error || !activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Activity not found.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const checkInCount = activity.check_in_ids.length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

      {/* ── 1. Route map ── */}
      <View style={styles.mapContainer}>
        {activity.route_points.length > 0 ? (
          <WebView
            source={{ html: mapHtml }}
            style={styles.map}
            scrollEnabled={false}
            javaScriptEnabled
            originWhitelist={['*']}
          />
        ) : (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <Text style={styles.mapPlaceholderText}>No route recorded</Text>
          </View>
        )}
      </View>

      {/* ── 2. Title ── */}
      <SectionCard>
        <Text style={styles.activityTitle}>{activity.title ?? 'Activity'}</Text>
        <Text style={styles.activityDate}>{formatDateLong(activity.started_at)}</Text>
      </SectionCard>

      {/* ── 3. Stats grid ── */}
      <SectionCard>
        <SectionTitle title="Stats" />
        <View style={styles.statsGrid}>
          <StatBox
            value={`${activity.distance_km.toFixed(2)} km`}
            label="Distance"
          />
          <StatBox
            value={formatDuration(activity.duration_seconds)}
            label="Duration"
          />
          <StatBox
            value={formatPace(activity.avg_pace_min_per_km)}
            label="Avg Pace"
          />
          <StatBox
            value={String(checkInCount)}
            label="Check-ins"
          />
        </View>
      </SectionCard>

      {/* ── 4. Date & time ── */}
      <SectionCard>
        <SectionTitle title="Date & Time" />
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Started</Text>
            <Text style={styles.timeValue}>{formatTime(activity.started_at)}</Text>
          </View>
          {activity.ended_at && (
            <>
              <View style={styles.timeSeparator} />
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Finished</Text>
                <Text style={styles.timeValue}>{formatTime(activity.ended_at)}</Text>
              </View>
            </>
          )}
        </View>
      </SectionCard>

      {/* ── 5. Check-ins ── */}
      {checkInCount > 0 && (
        <SectionCard>
          <SectionTitle title="Check-ins" />
          <View style={styles.checkInRow}>
            <View style={styles.checkInCountBadge}>
              <Text style={styles.checkInCountText}>{checkInCount}</Text>
            </View>
            <Text style={styles.checkInDescription}>
              {checkInCount === 1 ? 'Location' : 'Locations'} visited during this activity
            </Text>
          </View>
        </SectionCard>
      )}

      {/* ── 6. Delete button ── */}
      <TouchableOpacity
        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
        onPress={handleDelete}
        disabled={deleting}
        activeOpacity={0.8}
      >
        {deleting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Activity</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Map
  mapContainer: {
    height: 250,
    backgroundColor: '#D1D5DB',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Section card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Activity header
  activityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Stats grid (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statBox: {
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0066CC',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Time
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeSeparator: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },

  // Check-ins
  checkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInCountBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkInCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
  },
  checkInDescription: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },

  // Delete
  deleteButton: {
    backgroundColor: '#DC2626',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
