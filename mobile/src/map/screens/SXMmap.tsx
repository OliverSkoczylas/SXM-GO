/**
 * StMaartenMap.tsx
 *
 * React Native map component for the island of St. Maarten / Saint Martin
 * Map tiles: OpenStreetMap (free, no API key required)
 *
 * Features:
 *   - OSM tile rendering via react-native-maps UrlTile
 *   - Map centered on St. Maarten with full island view
 *   - Custom location pins for key island landmarks (color-coded by category)
 *   - Real-time GPS location tracking with animated blue dot
 *   - Accuracy circle around user position
 *   - "Follow Me" mode that re-centers the map on the user
 *   - Category filter pills to show/hide pin types
 *   - Live GPS status bar (lat/lng, accuracy, speed)
 *
 * ─── Dependencies ────────────────────────────────────────────────────────────
 *   npm install react-native-maps
 *   npx expo install expo-location        (Expo)
 *
 * ─── OSM Tile Policy ─────────────────────────────────────────────────────────
 *   We may need to change tilemap providers when going to scale, as OSM tilemap
 *   is only for small apps / development
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  UrlTile,
  PROVIDER_DEFAULT,
  Region,
} from 'react-native-maps';
import * as Location from 'expo-location';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationPin {
  id: string;
  title: string;
  description: string;
  coordinate: { latitude: number; longitude: number };
  category: 'beach' | 'city' | 'attraction' | 'airport' | 'marina';
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

// ─── OSM Tile URL ─────────────────────────────────────────────────────────────
//
// Swap this string to switch tile providers:


const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// ─── St. Maarten Region ───────────────────────────────────────────────────────

const ST_MAARTEN_INITIAL_REGION: Region = {
  latitude: 18.0425,
  longitude: -63.0548,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

// ─── Landmark Pins ────────────────────────────────────────────────────────────
// Temporary until the locations folder is set up

const ISLAND_PINS: LocationPin[] = [
  {
    id: 'philipsburg',
    title: 'Philipsburg',
    description: 'Capital of Sint Maarten (Dutch side)',
    coordinate: { latitude: 18.0237, longitude: -63.0458 },
    category: 'city',
  },
  {
    id: 'marigot',
    title: 'Marigot',
    description: 'Capital of Saint-Martin (French side)',
    coordinate: { latitude: 18.0681, longitude: -63.0847 },
    category: 'city',
  },
  {
    id: 'grand_case',
    title: 'Grand Case',
    description: 'Gourmet capital of the Caribbean',
    coordinate: { latitude: 18.1008, longitude: -63.0572 },
    category: 'city',
  },
  {
    id: 'princess_juliana',
    title: 'Princess Juliana Airport',
    description: 'Famous for low-flying aircraft over Maho Beach',
    coordinate: { latitude: 18.0410, longitude: -63.1089 },
    category: 'airport',
  },
  {
    id: 'maho_beach',
    title: 'Maho Beach',
    description: 'Iconic beach at the runway end',
    coordinate: { latitude: 18.0378, longitude: -63.1133 },
    category: 'beach',
  },
  {
    id: 'orient_beach',
    title: 'Orient Bay',
    description: 'Stunning 2 km beach on the French side',
    coordinate: { latitude: 18.0939, longitude: -63.0169 },
    category: 'beach',
  },
  {
    id: 'dawn_beach',
    title: 'Dawn Beach',
    description: 'Beautiful sunrise beach, Dutch side',
    coordinate: { latitude: 18.0461, longitude: -63.0069 },
    category: 'beach',
  },
  {
    id: 'simpson_bay',
    title: 'Simpson Bay',
    description: 'Large lagoon & marina hub',
    coordinate: { latitude: 18.0303, longitude: -63.0983 },
    category: 'marina',
  },
  {
    id: 'oyster_pond',
    title: 'Oyster Pond',
    description: 'Sheltered marina on the border',
    coordinate: { latitude: 18.0617, longitude: -63.0111 },
    category: 'marina',
  },
  {
    id: 'pic_du_paradis',
    title: 'Pic du Paradis',
    description: 'Highest point on the island (424 m)',
    coordinate: { latitude: 18.0864, longitude: -63.0656 },
    category: 'attraction',
  },
];

// ─── Category meta ────────────────────────────────────────────────────────────

const PIN_COLORS: Record<LocationPin['category'], string> = {
  beach: '#00BFA5',
  city: '#FF6F00',
  attraction: '#7B1FA2',
  airport: '#1565C0',
  marina: '#00838F',
};

const PIN_EMOJIS: Record<LocationPin['category'], string> = {
  beach: '🏖️',
  city: '🏙️',
  attraction: '⛰️',
  airport: '✈️',
  marina: '⚓',
};

const CATEGORIES: Array<LocationPin['category'] | 'all'> = [
  'all', 'beach', 'city', 'airport', 'marina', 'attraction',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StMaartenMap() {
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [followUser, setFollowUser] = useState(false);
  const [selectedPin, setSelectedPin] = useState<LocationPin | null>(null);
  const [activeCategory, setActiveCategory] = useState<LocationPin['category'] | 'all'>('all');

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // ── Pulse animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.7, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Start GPS ────────────────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied.');
        Alert.alert(
          'Permission Required',
          'Enable location access in Settings to use GPS tracking.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsTracking(true);
      setLocationError(null);

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
        heading: current.coords.heading,
        speed: current.coords.speed,
      });

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        (pos) =>
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          })
      );
    } catch {
      setLocationError('Could not get location.');
      setIsTracking(false);
    }
  }, []);

  // ── Stop GPS ─────────────────────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setIsTracking(false);
    setFollowUser(false);
  }, []);

  useEffect(() => () => { locationSubscription.current?.remove(); }, []);

  // ── Follow user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (followUser && userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        600
      );
    }
  }, [userLocation, followUser]);

  const goToIsland = () => {
    setFollowUser(false);
    mapRef.current?.animateToRegion(ST_MAARTEN_INITIAL_REGION, 800);
  };

  const visiblePins =
    activeCategory === 'all'
      ? ISLAND_PINS
      : ISLAND_PINS.filter((p) => p.category === activeCategory);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏝 St. Maarten</Text>
        <Text style={styles.headerSub}>
          Sint Maarten · Saint-Martin  ·  © OpenStreetMap contributors
        </Text>
      </View>

      {/* Category filter pills */}
      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterPill, activeCategory === cat && styles.filterPillActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterPillText, activeCategory === cat && styles.filterPillTextActive]}>
              {cat === 'all' ? '🗺 All' : `${PIN_EMOJIS[cat]} ${cat}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          mapType="none"            // hides Apple/Google base layer; OSM tiles render instead
          initialRegion={ST_MAARTEN_INITIAL_REGION}
          showsCompass
          showsScale
          rotateEnabled
          onPress={() => setSelectedPin(null)}
        >
          {/* OSM tile layer — drawn first, underneath everything else */}
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />

          {/* Landmark pins */}
          {visiblePins.map((pin) => (
            <Marker
              key={pin.id}
              coordinate={pin.coordinate}
              title={pin.title}
              description={pin.description}
              pinColor={PIN_COLORS[pin.category]}
              onPress={() => setSelectedPin(pin)}
            />
          ))}

          {/* User location */}
          {userLocation && (
            <>
              {userLocation.accuracy != null && (
                <Circle
                  center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                  radius={userLocation.accuracy}
                  strokeColor="rgba(66,133,244,0.45)"
                  fillColor="rgba(66,133,244,0.1)"
                  strokeWidth={1}
                />
              )}
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                flat
              >
                <View style={styles.userDotContainer}>
                  <Animated.View
                    style={[styles.userDotPulse, { transform: [{ scale: pulseAnim }] }]}
                  />
                  <View style={styles.userDot} />
                </View>
              </Marker>
            </>
          )}
        </MapView>

        {/* Floating controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={goToIsland}>
            <Text style={styles.controlBtnText}>🏝</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isTracking && styles.controlBtnTracking]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.controlBtnText}>{isTracking ? '📍' : '🔍'}</Text>
          </TouchableOpacity>

          {isTracking && (
            <TouchableOpacity
              style={[styles.controlBtn, followUser && styles.controlBtnFollow]}
              onPress={() => setFollowUser((v) => !v)}
            >
              <Text style={styles.controlBtnText}>🎯</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pin info card */}
        {selectedPin && (
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>{PIN_EMOJIS[selectedPin.category]}</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>{selectedPin.title}</Text>
              <Text style={styles.infoDesc}>{selectedPin.description}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPin(null)} style={styles.infoClose}>
              <Text style={styles.infoCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* GPS status bar */}
      {isTracking && userLocation && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            📡 {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            {userLocation.accuracy != null ? `  ±${Math.round(userLocation.accuracy)} m` : ''}
            {userLocation.speed != null && userLocation.speed > 0.5
              ? `  🚶 ${(userLocation.speed * 3.6).toFixed(1)} km/h`
              : ''}
          </Text>
        </View>
      )}

      {locationError && (
        <View style={[styles.statusBar, styles.statusBarError]}>
          <Text style={styles.statusText}>⚠️ {locationError}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE3F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2340',
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 11, color: '#9AA5B8', marginTop: 2 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    gap: 6,
    flexWrap: 'wrap',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE3F0',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#DDE3F0',
  },
  filterPillActive: { backgroundColor: '#1A2340', borderColor: '#1A2340' },
  filterPillText: {
    fontSize: 12,
    color: '#4A5878',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  filterPillTextActive: { color: '#fff' },

  mapWrapper: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

  controls: {
    position: 'absolute',
    right: 14,
    bottom: 24,
    gap: 10,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  controlBtnTracking: { backgroundColor: '#1A2340' },
  controlBtnFollow: { backgroundColor: '#0057FF' },
  controlBtnText: { fontSize: 20 },

  userDotContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotPulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(66,133,244,0.28)',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },

  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 80,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  infoEmoji: { fontSize: 28, marginRight: 12 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#1A2340' },
  infoDesc: { fontSize: 12, color: '#7A8BA6', marginTop: 2 },
  infoClose: { padding: 6, marginLeft: 8 },
  infoCloseText: { fontSize: 14, color: '#9AA5B8', fontWeight: '600' },

  statusBar: {
    backgroundColor: '#1A2340',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusBarError: { backgroundColor: '#C62828' },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});