// Anti-fraud GPS spoofing detection service
// FR-032: Detect and flag GPS spoofing attempts
// FR-033: Suspicious check-in patterns trigger manual review

import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from './supabaseClient';

const LAST_CHECKIN_KEY = 'fraud_last_checkin';

interface LastCheckInRecord {
  latitude: number;
  longitude: number;
  timestamp: number; // ms since epoch
}

// ── Haversine distance (metres) ────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Fraud Detection Checks ─────────────────────────────────────────────────

export interface FraudCheckResult {
  isSuspicious: boolean;
  reasons: string[];
  speedKmh: number | null;
  distanceMetres: number | null;
}

// Max realistic travel speed on St. Maarten (island is ~34 sq mi)
// 120 km/h allows for highway driving + GPS inaccuracy buffer
const MAX_SPEED_KMH = 120;

// Minimum time between check-ins at different locations (seconds)
const MIN_CHECKIN_INTERVAL_SEC = 30;

// If user "moves" more than this in under MIN_CHECKIN_INTERVAL, flag it
const TELEPORT_THRESHOLD_METRES = 500;

export async function checkForFraud(
  gpsLatitude: number,
  gpsLongitude: number,
  locationLatitude: number,
  locationLongitude: number,
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let speedKmh: number | null = null;
  let distanceMetres: number | null = null;

  // 1. Check GPS vs location distance — if user's GPS is far from the claimed location
  //    but they somehow passed the proximity check, that's suspicious
  const gpsToLocation = haversineDistance(gpsLatitude, gpsLongitude, locationLatitude, locationLongitude);
  if (gpsToLocation > 500) {
    reasons.push(`GPS position ${Math.round(gpsToLocation)}m from location`);
  }

  // 2. Check travel speed from last check-in
  const lastRaw = await AsyncStorage.getItem(LAST_CHECKIN_KEY);
  if (lastRaw) {
    const last: LastCheckInRecord = JSON.parse(lastRaw);
    const timeDiffMs = Date.now() - last.timestamp;
    const timeDiffSec = timeDiffMs / 1000;
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    distanceMetres = haversineDistance(last.latitude, last.longitude, gpsLatitude, gpsLongitude);

    // Teleport detection: large distance in very short time
    if (timeDiffSec < MIN_CHECKIN_INTERVAL_SEC && distanceMetres > TELEPORT_THRESHOLD_METRES) {
      reasons.push(`Moved ${Math.round(distanceMetres)}m in ${Math.round(timeDiffSec)}s (teleport)`);
    }

    // Speed check
    if (timeDiffHours > 0) {
      speedKmh = (distanceMetres / 1000) / timeDiffHours;
      if (speedKmh > MAX_SPEED_KMH) {
        reasons.push(`Travel speed ${Math.round(speedKmh)} km/h exceeds maximum ${MAX_SPEED_KMH} km/h`);
      }
    }
  }

  // 3. Android: check for mock location provider
  // Note: This check is done via the GPS position metadata when available.
  // The actual mock detection happens in validateGpsPosition below.

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    speedKmh,
    distanceMetres,
  };
}

// ── Record check-in for future fraud comparisons ───────────────────────────

export async function recordCheckInPosition(latitude: number, longitude: number): Promise<void> {
  const record: LastCheckInRecord = {
    latitude,
    longitude,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(LAST_CHECKIN_KEY, JSON.stringify(record));
}

// ── Flag suspicious check-in in database ───────────────────────────────────

export async function flagSuspiciousCheckIn(
  locationId: string,
  fraudResult: FraudCheckResult,
  gpsLatitude: number,
  gpsLongitude: number,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('flagged_check_ins')
    .insert({
      user_id: user.id,
      location_id: locationId,
      flag_reason: fraudResult.reasons.join('; '),
      gps_latitude: gpsLatitude,
      gps_longitude: gpsLongitude,
      distance_metres: fraudResult.distanceMetres,
      speed_kmh: fraudResult.speedKmh,
    });
}

// ── GPS Position Validation ────────────────────────────────────────────────
// Wraps geolocation to detect mock locations on Android

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  isMocked: boolean;
}

export function getValidatedGpsPosition(): Promise<GpsPosition | null> {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Android exposes `isMocked` on the Position object (API 31+)
        // For older versions or iOS, we default to false
        const isMocked = Platform.OS === 'android'
          ? (position as any).mocked === true || (position.coords as any).isMocked === true
          : false;

        resolve({ latitude, longitude, accuracy, isMocked });
      },
      () => resolve(null),
      { timeout: 20000, maximumAge: 0, enableHighAccuracy: true },
    );
  });
}

// ── High-accuracy validation for check-in ──────────────────────────────────

export interface CheckInValidation {
  allowed: boolean;
  gps: GpsPosition | null;
  distanceMetres: number | null;
  fraudResult: FraudCheckResult | null;
  denyReason: string | null;
}

const CHECK_IN_RADIUS_METRES = 150;

export async function validateCheckIn(
  locationLatitude: number,
  locationLongitude: number,
): Promise<CheckInValidation> {
  const gps = await getValidatedGpsPosition();

  if (!gps) {
    return { allowed: false, gps: null, distanceMetres: null, fraudResult: null, denyReason: 'Unable to get GPS position.' };
  }

  // Reject mock locations outright
  if (gps.isMocked) {
    return { allowed: false, gps, distanceMetres: null, fraudResult: null, denyReason: 'Mock location detected. Please disable mock locations.' };
  }

  // Very low accuracy GPS is unreliable
  if (gps.accuracy > 500) {
    return { allowed: false, gps, distanceMetres: null, fraudResult: null, denyReason: 'GPS accuracy too low. Please move to an open area and try again.' };
  }

  const distance = haversineDistance(gps.latitude, gps.longitude, locationLatitude, locationLongitude);

  if (distance > CHECK_IN_RADIUS_METRES) {
    return {
      allowed: false,
      gps,
      distanceMetres: distance,
      fraudResult: null,
      denyReason: `You are ${Math.round(distance)}m away. Must be within ${CHECK_IN_RADIUS_METRES}m.`,
    };
  }

  // Run fraud checks
  const fraudResult = await checkForFraud(gps.latitude, gps.longitude, locationLatitude, locationLongitude);

  return {
    allowed: true,
    gps,
    distanceMetres: distance,
    fraudResult,
    denyReason: null,
  };
}
