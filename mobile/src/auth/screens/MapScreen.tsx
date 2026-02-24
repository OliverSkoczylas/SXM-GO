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
} from 'react-native';
// Note: You must run 'npm install react-native-webview' and rebuild the app
import { WebView } from 'react-native-webview';
import { getLocations, checkIn, Location } from '../services/locationService';
import { useAuth } from '../hooks/useAuth';
import Toast from '../../shared/components/Toast';

export default function MapScreen() {
  const { profile, refreshProfile } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const webViewRef = useRef<WebView>(null);

  const categories = ['Beach', 'Restaurant', 'Casino', 'Attraction', 'Shopping', 'Entertainment'];

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

  const handleCheckIn = async (location: Location) => {
    if (location.visited) {
      Alert.alert('Already Visited', 'You have already checked in at this location.');
      return;
    }

    Alert.alert(
      'Check In',
      `Check in at ${location.name} for ${location.points} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const { error } = await checkIn(location.id, location.points);
            if (error) {
              Alert.alert('Error', error.message || 'Failed to check in.');
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
        .visited-marker { filter: grayscale(100%) opacity(0.6); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([18.0425, -63.0548], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        let markers = [];

        window.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'SET_PINS') {
            // Clear existing markers
            markers.forEach(m => map.removeLayer(m));
            markers = [];

            data.payload.forEach(pin => {
              const marker = L.marker([pin.lat, pin.lng]).addTo(map);
              
              if (pin.visited) {
                marker._icon.classList.add('visited-marker');
              }

              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PIN_CLICKED',
                  payload: { id: pin.id }
                }));
              });
              
              markers.push(marker);
            });

            // Adjust view if there are pins
            if (markers.length > 0 && !window.hasAdjustedOnce) {
              const group = new L.featureGroup(markers);
              map.fitBounds(group.getBounds().pad(0.1));
              window.hasAdjustedOnce = true;
            }
          }
        });

        // Notify app that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
      </script>
    </body>
    </html>
  `;

  const renderLocationItem = ({ item }: { item: Location }) => (
    <View style={[styles.locationCard, item.visited && styles.visitedCard]}>
      <View style={styles.cardInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationCategory}>{item.category} • {item.points} pts</Text>
      </View>
      <TouchableOpacity
        style={[styles.checkInButton, item.visited && styles.visitedButton]}
        onPress={() => handleCheckIn(item)}
      >
        <Text style={[styles.checkInText, item.visited && styles.visitedText]}>
          {item.visited ? '✓' : 'Check In'}
        </Text>
      </TouchableOpacity>
    </View>
  );

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

      <ScrollView 
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchLocations(true)} tintColor="#0066CC" />
        }
      >
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={onMessage}
            style={styles.map}
            onLoadEnd={() => updateMapPins(filteredLocations)}
            scrollEnabled={false} // Prevent map from swallowing vertical scroll
          />
          {isLoading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#0066CC" />
            </View>
          )}
        </View>

        <View style={styles.listContainer}>
          {filteredLocations.map(item => (
            <View key={item.id} style={[styles.locationCard, item.visited && styles.visitedCard]}>
              <View style={styles.cardInfo}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationCategory}>{item.category} • {item.points} pts</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkInButton, item.visited && styles.visitedButton]}
                onPress={() => handleCheckIn(item)}
              >
                <Text style={[styles.checkInText, item.visited && styles.visitedText]}>
                  {item.visited ? '✓' : 'Check In'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          {filteredLocations.length === 0 && !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No locations found in this category.</Text>
            </View>
          )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  categoryBar: { flexDirection: 'row' },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  activeTab: { backgroundColor: '#0066CC' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  mainScroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  mapContainer: { height: 350, backgroundColor: '#E5E7EB' },
  map: { flex: 1 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  visitedCard: { opacity: 0.7 },
  cardInfo: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  locationCategory: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  checkInButton: { backgroundColor: '#0066CC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  visitedButton: { backgroundColor: '#E5E7EB' },
  checkInText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  visitedText: { color: '#9CA3AF' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});
