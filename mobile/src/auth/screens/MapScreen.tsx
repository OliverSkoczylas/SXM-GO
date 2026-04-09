// Map screen using OpenStreetMap via WebView
// FR-012 to FR-023: Interactive map and location pins
// FR-016: Real-time user location dot
// FR-023: Directions to selected locations
// FR-024: Offline map caching
// FR-027 to FR-035: Check-in mechanism with GPS proximity + anti-fraud

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getLocations, checkIn, Location } from '../services/locationService';
import { openDirections } from '../services/directionsService';
import { getPendingCheckIns } from '../services/offlineService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../../shared/components/Toast';
import AddToItineraryModal from '../components/AddToItineraryModal';

// Category config — colors and emoji for pins + UI
const CATEGORY_CONFIG: Record<string, { color: string; emoji: string; bg: string }> = {
  Beach:         { color: '#0EA5E9', emoji: '\u{1F3D6}',  bg: '#E0F2FE' },
  Restaurant:    { color: '#F97316', emoji: '\u{1F37D}',  bg: '#FFF7ED' },
  Casino:        { color: '#EF4444', emoji: '\u{1F3B0}',  bg: '#FEF2F2' },
  Attraction:    { color: '#8B5CF6', emoji: '\u{1F3DB}',  bg: '#F5F3FF' },
  Shopping:      { color: '#EC4899', emoji: '\u{1F6CD}',  bg: '#FDF2F8' },
  Entertainment: { color: '#10B981', emoji: '\u{1F3B6}',  bg: '#ECFDF5' },
};

function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000, enableHighAccuracy: true },
    );
  });
}

export default function MapScreen() {
  const { profile, refreshProfile } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [selectedLocationForItinerary, setSelectedLocationForItinerary] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const categories = ['Beach', 'Restaurant', 'Casino', 'Attraction', 'Shopping', 'Entertainment'];

  useEffect(() => {
    let active = true;
    const sendLocation = async () => {
      const loc = await getUserLocation();
      if (loc && active) {
        webViewRef.current?.postMessage(
          JSON.stringify({ type: 'SET_USER_LOCATION', payload: loc }),
        );
      }
    };
    sendLocation();
    const interval = setInterval(sendLocation, 15000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    getPendingCheckIns().then(p => setPendingCount(p.length));
  }, []);

  const fetchLocations = useCallback(async (refreshing = false) => {
    if (!refreshing) setIsLoading(true);
    const { data, error } = await getLocations();
    if (error) {
      console.error('[Map] Error fetching locations:', error);
    } else {
      setLocations(data || []);
      const filtered = selectedCategory
        ? (data || []).filter(l => l.category === selectedCategory)
        : (data || []);
      setFilteredLocations(filtered);
      updateMapPins(filtered);
    }
    getPendingCheckIns().then(p => setPendingCount(p.length));
    setIsLoading(false);
    setIsRefreshing(false);
  }, [selectedCategory]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const updateMapPins = (locs: Location[]) => {
    const message = {
      type: 'SET_PINS',
      payload: locs.map(l => ({
        id: l.id, name: l.name, lat: l.latitude, lng: l.longitude,
        category: l.category, visited: l.visited, points: l.points,
      })),
    };
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    const filtered = category ? locations.filter(l => l.category === category) : locations;
    setFilteredLocations(filtered);
    updateMapPins(filtered);
  };

  const doCheckIn = async (location: Location) => {
    const result = await checkIn(location);
    if (result.error) {
      Alert.alert('Check-In Failed', result.error.message || 'Failed to check in.');
      return;
    }
    if (result.offline) {
      setToast({ visible: true, message: 'Offline check-in queued! Will sync when online.', type: 'success' });
      setPendingCount(prev => prev + 1);
    } else {
      const msg = result.flagged
        ? `+${location.points} pts at ${location.name} (under review)`
        : `+${location.points} pts at ${location.name}!`;
      setToast({ visible: true, message: msg, type: 'success' });
    }
    fetchLocations(true);
    refreshProfile();
  };

  const handleCheckIn = async (location: Location) => {
    if (location.visited) {
      Alert.alert('Already Visited', 'You have already checked in at this location.');
      return;
    }
    Alert.alert(
      location.name,
      `${CATEGORY_CONFIG[location.category]?.emoji || ''} ${location.category}  •  ${location.points} pts`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Directions', onPress: () => openDirections(location.latitude, location.longitude, location.name) },
        { text: 'Add to Itinerary', onPress: () => setSelectedLocationForItinerary(location.id) },
        { text: 'Check In', onPress: () => doCheckIn(location) },
      ],
    );
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_CLICKED') {
        const location = locations.find(l => l.id === data.payload.id);
        if (location) handleCheckIn(location);
      }
    } catch (e) {
      console.error('[Map] WebView message error:', e);
    }
  };

  const handleFocusLocation = (location: Location) => {
    webViewRef.current?.injectJavaScript(`
      if (window.map) { window.map.flyTo([${location.latitude}, ${location.longitude}], 16, { animate: true, duration: 1.2 }); }
      true;
    `);
  };

  // ── Leaflet map HTML ─────────────────────────────────────────────────────
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { height: 100%; width: 100%; background: #0C1B2A; }

        /* Pulsing user dot */
        @keyframes pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          70%  { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .user-pulse {
          width: 14px; height: 14px; border-radius: 50%;
          background: rgba(59,130,246,0.4);
          animation: pulse 2s ease-out infinite;
        }
        .user-dot {
          width: 14px; height: 14px; border-radius: 50%;
          background: #3B82F6; border: 3px solid #fff;
          box-shadow: 0 0 8px rgba(59,130,246,0.6);
          position: absolute; top: 0; left: 0;
        }

        /* Custom pin markers */
        .pin-marker {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg); border: 2.5px solid #fff;
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          transition: transform 0.15s ease;
        }
        .pin-marker:hover { transform: rotate(-45deg) scale(1.15); }
        .pin-marker .pin-inner {
          transform: rotate(45deg); font-size: 16px; line-height: 1;
        }
        .pin-marker.visited {
          opacity: 0.45; filter: saturate(0.3);
          border-color: rgba(255,255,255,0.5);
        }

        /* Points badge */
        .pts-badge {
          position: absolute; top: -8px; right: -12px;
          background: #1E293B; color: #FCD34D; font-size: 9px; font-weight: 800;
          padding: 1px 5px; border-radius: 8px; white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3); letter-spacing: 0.3px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .pin-marker.visited .pts-badge { display: none; }

        /* Hide default Leaflet attribution bar — too large on mobile */
        .leaflet-control-attribution { font-size: 8px !important; opacity: 0.5; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const COLORS = {
          Beach: '#0EA5E9', Restaurant: '#F97316', Casino: '#EF4444',
          Attraction: '#8B5CF6', Shopping: '#EC4899', Entertainment: '#10B981'
        };
        const EMOJI = {
          Beach: '\\u{1F3D6}', Restaurant: '\\u{1F37D}', Casino: '\\u{1F3B0}',
          Attraction: '\\u{1F3DB}', Shopping: '\\u{1F6CD}', Entertainment: '\\u{1F3B6}'
        };

        const map = L.map('map', {
          zoomControl: false,
          attributionControl: true
        }).setView([18.0425, -63.0548], 12);
        window.map = map;

        // CartoDB Voyager — clean, modern, great water color
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/">OSM</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        let markers = [];

        function createPinIcon(category, visited, points) {
          const color = COLORS[category] || '#6B7280';
          const emoji = EMOJI[category] || '\\u{1F4CD}';
          const html = '<div class="pin-marker ' + (visited ? 'visited' : '') + '" style="background:' + color + '">'
            + '<span class="pin-inner">' + emoji + '</span>'
            + '<span class="pts-badge">' + points + '</span>'
            + '</div>';
          return L.divIcon({
            html: html,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
          });
        }

        window.addEventListener('message', (event) => {
          let data;
          try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch (e) { return; }

          if (data.type === 'SET_PINS') {
            markers.forEach(m => map.removeLayer(m));
            markers = [];

            data.payload.forEach(pin => {
              const icon = createPinIcon(pin.category, pin.visited, pin.points);
              const marker = L.marker([pin.lat, pin.lng], { icon: icon }).addTo(map);
              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PIN_CLICKED', payload: { id: pin.id }
                }));
              });
              markers.push(marker);
            });

            if (markers.length > 0 && !window.hasAdjustedOnce) {
              map.fitBounds(new L.featureGroup(markers).getBounds().pad(0.1));
              window.hasAdjustedOnce = true;
            }
          }

          if (data.type === 'SET_USER_LOCATION') {
            const { lat, lng } = data.payload;
            if (window.userDot) {
              window.userDot.setLatLng([lat, lng]);
            } else {
              const icon = L.divIcon({
                html: '<div class="user-pulse"></div><div class="user-dot"></div>',
                className: '',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });
              window.userDot = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
            }
          }
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
      </script>
    </body>
    </html>
  `;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Explore</Text>
          {profile && (
            <View style={styles.pointsPill}>
              <Text style={styles.pointsText}>{profile.total_points} pts</Text>
            </View>
          )}
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingText}>
              {pendingCount} offline check-in{pendingCount > 1 ? 's' : ''} pending sync
            </Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={styles.categoryBarContent}>
          <TouchableOpacity
            style={[styles.categoryTab, !selectedCategory && styles.activeTab]}
            onPress={() => handleCategoryFilter(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, active && { backgroundColor: cfg.color }]}
                onPress={() => handleCategoryFilter(cat)}
              >
                <Text style={[styles.categoryText, active && styles.activeTabText]}>
                  {cfg.emoji} {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          onMessage={onMessage}
          style={styles.map}
          onLoadEnd={() => updateMapPins(filteredLocations)}
        />
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}
      </View>

      {/* Location List */}
      <FlatList
        data={filteredLocations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchLocations(true)} tintColor="#3B82F6" />
        }
        renderItem={({ item }) => {
          const cfg = CATEGORY_CONFIG[item.category] || { color: '#6B7280', emoji: '', bg: '#F9FAFB' };
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleFocusLocation(item)}
              style={[styles.locationCard, item.visited && styles.visitedCard]}
            >
              {/* Category icon bubble */}
              <View style={[styles.iconBubble, { backgroundColor: cfg.bg }]}>
                <Text style={styles.iconEmoji}>{cfg.emoji}</Text>
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.locationName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.locationMeta}>
                  <Text style={{ color: cfg.color, fontWeight: '700' }}>{item.category}</Text>
                  {'  •  '}{item.points} pts
                  {item.visited ? '  •  Visited' : ''}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.goButton}
                  onPress={() => openDirections(item.latitude, item.longitude, item.name)}
                >
                  <Text style={styles.goButtonText}>Go</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.checkInBtn, item.visited && styles.checkInBtnVisited]}
                  onPress={() => handleCheckIn(item)}
                >
                  <Text style={[styles.checkInBtnText, item.visited && styles.checkInBtnTextVisited]}>
                    {item.visited ? '\u2713' : 'Check In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>{selectedCategory ? CATEGORY_CONFIG[selectedCategory]?.emoji : ''}</Text>
              <Text style={styles.emptyText}>No locations found.</Text>
            </View>
          ) : null
        }
      />

      <AddToItineraryModal
        visible={!!selectedLocationForItinerary}
        onClose={() => setSelectedLocationForItinerary(null)}
        onAdd={() => {
          setSelectedLocationForItinerary(null);
          setToast({ visible: true, message: 'Added to itinerary!', type: 'success' });
        }}
        locationId={selectedLocationForItinerary || ''}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  pointsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsText: { fontSize: 13, fontWeight: '800', color: '#92400E' },

  pendingBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  pendingText: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  categoryBar: { flexDirection: 'row' },
  categoryBarContent: { paddingRight: 20 },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeTab: { backgroundColor: '#0F172A' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },

  // Map
  mapContainer: { height: 380, backgroundColor: '#0C1B2A' },
  map: { flex: 1 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Location list
  listContent: { padding: 14, paddingBottom: 100 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  visitedCard: { opacity: 0.55 },

  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: { fontSize: 20 },

  cardInfo: { flex: 1, marginRight: 8 },
  locationName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  locationMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  cardActions: { flexDirection: 'row', gap: 6 },
  goButton: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  goButtonText: { color: '#16A34A', fontWeight: '800', fontSize: 12 },

  checkInBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  checkInBtnVisited: { backgroundColor: '#F1F5F9' },
  checkInBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  checkInBtnTextVisited: { color: '#94A3B8' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
});
