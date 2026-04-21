// Map screen using OpenStreetMap via WebView
// This provides a free, interactive map without requiring Google Maps API keys.
// FR-012 to FR-023: Interactive map and location pins
// FR-027 to FR-031: Check-in mechanism

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
  Linking,
} from 'react-native';
// Note: You must run 'npm install react-native-webview @react-native-community/geolocation' and rebuild the app
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { getLocations, checkIn, Location, getDistance } from '../services/locationService';
import { shareService } from '../services/shareService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../../shared/components/Toast';
import AddToItineraryModal from '../components/AddToItineraryModal';

export default function MapScreen() {
  const { profile, refreshProfile } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const [selectedLocationForItinerary, setSelectedLocationForItinerary] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const webViewRef = useRef<WebView>(null);
  const watchId = useRef<number | null>(null);

  const categories = ['Beach', 'Restaurant', 'Casino', 'Attraction', 'Shopping', 'Entertainment'];

  // FR-016: Real-time user location tracking
  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        updateUserMarker(latitude, longitude);
      },
      (error) => console.error('[Map] Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );

    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        updateUserMarker(latitude, longitude);
      },
      (error) => console.error('[Map] Geolocation watch error:', error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const updateUserMarker = (lat: number, lng: number) => {
    const message = {
      type: 'UPDATE_USER_LOC',
      payload: { lat, lng }
    };
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

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
      
      // Update the map pins
      updateMapPins(filtered);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const updateMapPins = (locs: Location[]) => {
    const message = {
      type: 'SET_PINS',
      payload: locs.map(l => ({
        id: l.id,
        name: l.name,
        lat: l.latitude,
        lng: l.longitude,
        category: l.category,
        visited: l.visited,
        points: l.points
      }))
    };
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    const filtered = category ? locations.filter(l => l.category === category) : locations;
    setFilteredLocations(filtered);
    updateMapPins(filtered);
  };

  // FR-023: Directions to selected locations
  const handleGetDirections = (location: Location) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${location.latitude},${location.longitude}`;
    const label = location.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) Linking.openURL(url);
  };

  const handleCheckIn = async (location: Location) => {
    if (location.visited) {
      Alert.alert('Already Visited', 'You have already checked in at this location.');
      return;
    }

    // FR-027, FR-028: Check distance before showing "Check In" as valid
    const distance = userLocation 
      ? getDistance(userLocation.latitude, userLocation.longitude, location.latitude, location.longitude)
      : Infinity;

    Alert.alert(
      location.name,
      `${location.category} • ${location.points} points\n${distance < 1000 ? `${Math.round(distance)}m away` : `${(distance/1000).toFixed(1)}km away`}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Get Directions', 
          onPress: () => handleGetDirections(location) 
        },
        { 
          text: 'Add to Itinerary', 
          onPress: () => setSelectedLocationForItinerary(location.id) 
        },
        {
          text: 'Check In',
          onPress: async () => {
            const { error } = await checkIn(
              location.id, 
              location.points, 
              userLocation || undefined, 
              { latitude: location.latitude, longitude: location.longitude }
            );
            if (error) {
              Alert.alert('Cannot Check In', error.message || 'Failed to check in.');
            } else {
              setToast({ visible: true, message: `Checked in! +${location.points} points`, type: 'success' });
              fetchLocations(true);
              refreshProfile();
            }
          },
        },
      ]
    );
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_CLICKED') {
        const location = locations.find(l => l.id === data.payload.id);
        if (location) {
          handleCheckIn(location);
        }
      }
    } catch (e) {
      console.error('[Map] WebView message error:', e);
    }
  };

  const handleFocusLocation = (location: Location) => {
    const js = `
      if (window.map) {
        window.map.flyTo([${location.latitude}, ${location.longitude}], 16, {
          animate: true,
          duration: 1.5
        });
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
  };

  // HTML content for the Leaflet map
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #f0f0f0; }
        .user-marker {
          background-color: #0066CC;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([18.0425, -63.0548], 12);
        window.map = map; // Make accessible for injectJavaScript

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        let markers = [];
        let userMarker = null;

        window.addEventListener('message', (event) => {
          let data;
          try {
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          } catch (e) { return; }

          if (data.type === 'UPDATE_USER_LOC') {
            const { lat, lng } = data.payload;
            if (!userMarker) {
              const userIcon = L.divIcon({
                className: 'user-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });
              userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
            } else {
              userMarker.setLatLng([lat, lng]);
            }
          }

          if (data.type === 'SET_PINS') {
            markers.forEach(m => map.removeLayer(m));
            markers = [];

            data.payload.forEach(pin => {
              const marker = L.marker([pin.lat, pin.lng]).addTo(map);
              if (pin.visited) marker._icon.classList.add('visited-marker');
              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PIN_CLICKED',
                  payload: { id: pin.id }
                }));
              });
              markers.push(marker);
            });

            if (markers.length > 0 && !window.hasAdjustedOnce) {
              const group = new L.featureGroup(markers);
              map.fitBounds(group.getBounds().pad(0.1));
              window.hasAdjustedOnce = true;
            }
          }
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
          <TouchableOpacity
            style={[styles.categoryTab, !selectedCategory && styles.activeTab]}
            onPress={() => handleCategoryFilter(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, selectedCategory === cat && styles.activeTab]}
              onPress={() => handleCategoryFilter(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.activeTabText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
            <ActivityIndicator size="large" color="#0066CC" />
          </View>
        )}
      </View>

      <FlatList
        data={filteredLocations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchLocations(true)} tintColor="#0066CC" />
        }
        renderItem={({ item }) => (
          <View style={[styles.locationCard, item.visited && styles.visitedCard]}>
            <TouchableOpacity 
              style={styles.cardInfo}
              onPress={() => handleFocusLocation(item)}
            >
              <Text style={styles.locationName}>{item.name}</Text>
              <Text style={styles.locationCategory}>{item.category} • {item.points} pts</Text>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setSelectedLocationForItinerary(item.id)}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkInButton, item.visited && styles.visitedButton]}
                onPress={() => handleCheckIn(item)}
              >
                <Text style={[styles.checkInText, item.visited && styles.visitedText]}>
                  {item.visited ? '✓' : 'Check In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No locations found in this category.</Text>
            </View>
          ) : null
        }
      />

      <AddToItineraryModal
        visible={!!selectedLocationForItinerary}
        onClose={() => {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  categoryBar: { flexDirection: 'row' },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  activeTab: { backgroundColor: '#0066CC' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  mapContainer: { height: 350, backgroundColor: '#E5E7EB' },
  map: { flex: 1 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  visitedCard: { opacity: 0.7 },
  cardInfo: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  locationCategory: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  addButton: { borderWidth: 1, borderColor: '#0066CC', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, justifyContent: 'center' },
  addButtonText: { color: '#0066CC', fontWeight: '600', fontSize: 12 },
  checkInButton: { backgroundColor: '#0066CC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, justifyContent: 'center' },
  visitedButton: { backgroundColor: '#E5E7EB' },
  checkInText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  visitedText: { color: '#9CA3AF' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});
