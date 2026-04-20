import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { log } from '../../shared/services/logger';
import {
  startActivity,
  addRoutePoint,
  stopActivity,
  formatDuration,
  formatPace,
  RoutePoint,
  Activity,
} from '../services/activityTrackingService';

type ActivityScreenNav = NativeStackNavigationProp<MapStackParamList, 'ActivityLive'>;

type Phase = 'idle' | 'tracking';

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #1E293B; }
    .leaflet-control-zoom { display: none; }
    .leaflet-control-attribution { font-size: 8px !important; opacity: 0.4; }

    @keyframes pulse {
      0%   { transform: scale(1);   opacity: 0.8; }
      50%  { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(1);   opacity: 0; }
    }
    .user-pulse {
      position: absolute;
      width: 22px; height: 22px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.45);
      top: -4px; left: -4px;
      animation: pulse 1.8s ease-out infinite;
    }
    .user-dot {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #3B82F6;
      border: 2.5px solid #fff;
      box-shadow: 0 0 6px rgba(59,130,246,0.7);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([18.0425, -63.0548], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    var userMarker = null;
    var routeLine = null;

    function updateRoute(points, currentPos) {
      // Update or draw the route polyline
      if (points && points.length >= 2) {
        var latlngs = points.map(function(p) { return [p.lat, p.lng]; });
        if (routeLine) {
          routeLine.setLatLngs(latlngs);
        } else {
          routeLine = L.polyline(latlngs, {
            color: '#EF4444',
            weight: 4,
            opacity: 0.85,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(map);
        }
      }

      // Update or place the user dot
      if (currentPos) {
        if (userMarker) {
          userMarker.setLatLng([currentPos.lat, currentPos.lng]);
        } else {
          var icon = L.divIcon({
            html: '<div class="user-pulse"></div><div class="user-dot"></div>',
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          userMarker = L.marker([currentPos.lat, currentPos.lng], { icon: icon }).addTo(map);
        }
        map.panTo([currentPos.lat, currentPos.lng], { animate: true, duration: 0.5 });
      }
    }

    window.updateRoute = updateRoute;

    window.addEventListener('message', function(event) {
      var data;
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch(e) { return; }
      if (data.type === 'UPDATE_ROUTE') {
        updateRoute(data.points, data.currentPos);
      }
    });

    // Android WebView also fires via document
    document.addEventListener('message', function(event) {
      var data;
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch(e) { return; }
      if (data.type === 'UPDATE_ROUTE') {
        updateRoute(data.points, data.currentPos);
      }
    });
  </script>
</body>
</html>
`;

export default function ActivityScreen() {
  const navigation = useNavigation<ActivityScreenNav>();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isStopping, setIsStopping] = useState<boolean>(false);

  const webViewRef = useRef<WebView>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityIdRef = useRef<string | null>(null);
  const routePointsRef = useRef<RoutePoint[]>([]);

  // Keep ref in sync so the GPS callback always has fresh points
  useEffect(() => {
    routePointsRef.current = routePoints;
  }, [routePoints]);

  const leafletHtml = useMemo(() => LEAFLET_HTML, []);

  const sendRouteToMap = useCallback(
    (points: RoutePoint[], pos: { lat: number; lng: number } | null) => {
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'UPDATE_ROUTE', points, currentPos: pos }),
      );
    },
    [],
  );

  const startDurationTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handlePositionUpdate = useCallback(
    (position: any) => {
      const { latitude, longitude } = position.coords;
      const point: RoutePoint = {
        lat: latitude,
        lng: longitude,
        timestamp: Date.now(),
      };

      const newPoints = [...routePointsRef.current, point];
      routePointsRef.current = newPoints;
      setRoutePoints(newPoints);

      const pos = { lat: latitude, lng: longitude };
      setCurrentPosition(pos);
      sendRouteToMap(newPoints, pos);

      // Persist point asynchronously — log errors for debugging
      if (activityIdRef.current) {
        addRoutePoint(activityIdRef.current, point).catch((error) => {
          log.warn(`[Activity] Failed to save route point:`, error);
        });
      }
    },
    [sendRouteToMap],
  );

  const startGPSWatch = useCallback(() => {
    const options: any = {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 5000,
    };
    const handleGPSError = (error: any) => {
      log.warn(`[Activity] GPS error: ${error.message}`);
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleGPSError,
      options,
    );
  }, [handlePositionUpdate]);

  const handleStart = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'You must be signed in to track an activity.');
      return;
    }

    const { data, error } = await startActivity(user.id);
    if (error || !data) {
      Alert.alert('Error', 'Failed to start activity. Please try again.');
      return;
    }

    activityIdRef.current = data.id;
    setCurrentActivity(data);
    setRoutePoints([]);
    setElapsedSeconds(0);
    setCurrentPosition(null);
    setPhase('tracking');
    startDurationTimer();
    startGPSWatch();
  }, [user, startDurationTimer, startGPSWatch]);

  const handleStop = useCallback(async () => {
    if (!activityIdRef.current || isStopping) return;
    setIsStopping(true);

    clearTimers();

    const { data, error } = await stopActivity(activityIdRef.current, []);
    if (error || !data) {
      setIsStopping(false);
      Alert.alert('Error', 'Failed to save your activity. Please try again.');
      return;
    }

    const savedId = activityIdRef.current;
    activityIdRef.current = null;
    setIsStopping(false);
    setPhase('idle');

    navigation.replace('ActivityDetail', { activityId: savedId });
  }, [isStopping, clearTimers, navigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Derived display values
  const distanceKm = useMemo(() => {
    // Simple accumulation from local routePoints for real-time display
    if (routePoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const a = routePoints[i - 1];
      const b = routePoints[i];
      const R = 6371;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }
    return total;
  }, [routePoints]);

  const paceMinPerKm = distanceKm > 0 ? elapsedSeconds / 60 / distanceKm : 0;

  if (phase === 'idle') {
    return (
      <View style={styles.idleContainer}>
        <View style={styles.idleContent}>
          <Text style={styles.idleIcon}>🏃</Text>
          <Text style={styles.idleTitle}>Track Your Route</Text>
          <Text style={styles.idleSubtitle}>
            Record your exploration route across St. Maarten
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.idleFootnote}>GPS will track your path while you explore</Text>
      </View>
    );
  }

  return (
    <View style={styles.trackingContainer}>
      {/* Stats header */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{distanceKm.toFixed(2)} km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pace</Text>
          <Text style={styles.statValue}>
            {paceMinPerKm > 0 ? formatPace(paceMinPerKm) : '--:-- /km'}
          </Text>
        </View>
      </View>

      {/* Live map */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: leafletHtml }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        scrollEnabled={false}
        bounces={false}
      />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {formatDuration(elapsedSeconds)}{'  ·  '}
            {distanceKm.toFixed(2)} km
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.stopButton, isStopping && styles.stopButtonDisabled]}
          onPress={handleStop}
          activeOpacity={0.8}
          disabled={isStopping}
        >
          <Text style={styles.stopButtonText}>
            {isStopping ? 'Saving…' : 'Stop & Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Idle phase ──
  idleContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  idleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleIcon: {
    fontSize: 72,
    marginBottom: 24,
  },
  idleTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
  },
  idleSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  startButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 72,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  idleFootnote: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },

  // ── Tracking phase ──
  trackingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FEF3C7',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#1E293B',
  },
  map: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  bottomControls: {
    backgroundColor: '#0F172A',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  summaryRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  stopButtonDisabled: {
    backgroundColor: '#7F1D1D',
    shadowOpacity: 0,
    elevation: 0,
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
