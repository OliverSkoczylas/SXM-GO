// Permission handling service (UX-004)
// Centralizes runtime permission requests for location, camera, and photo library.
// Uses react-native-permissions for cross-platform consistency.

import { Platform, Alert, Linking } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
  Permission,
} from 'react-native-permissions';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

// Maps our app-level permission names to platform-specific constants
const LOCATION_PERMISSION: Permission = Platform.select({
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
})!;

const CAMERA_PERMISSION: Permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
})!;

const PHOTO_LIBRARY_PERMISSION: Permission = Platform.select({
  ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  // Android 13+ uses READ_MEDIA_IMAGES; older versions use READ_EXTERNAL_STORAGE
  android:
    Number(Platform.Version) >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
})!;

function mapResult(result: string): PermissionStatus {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    default:
      return 'unavailable';
  }
}

// ── Check without prompting ──

export async function checkLocationPermission(): Promise<PermissionStatus> {
  const result = await check(LOCATION_PERMISSION);
  return mapResult(result);
}

export async function checkCameraPermission(): Promise<PermissionStatus> {
  const result = await check(CAMERA_PERMISSION);
  return mapResult(result);
}

export async function checkPhotoLibraryPermission(): Promise<PermissionStatus> {
  const result = await check(PHOTO_LIBRARY_PERMISSION);
  return mapResult(result);
}

// ── Request (prompts user if not yet determined) ──

export async function requestLocationPermission(): Promise<PermissionStatus> {
  const status = await checkLocationPermission();

  if (status === 'granted') return 'granted';

  if (status === 'blocked') {
    showBlockedAlert(
      'Location Permission Required',
      'SXM GO needs location access to verify check-ins. Please enable it in Settings.',
    );
    return 'blocked';
  }

  const result = await request(LOCATION_PERMISSION);
  return mapResult(result);
}

export async function requestCameraPermission(): Promise<PermissionStatus> {
  const status = await checkCameraPermission();

  if (status === 'granted') return 'granted';

  if (status === 'blocked') {
    showBlockedAlert(
      'Camera Permission Required',
      'SXM GO needs camera access to take profile photos. Please enable it in Settings.',
    );
    return 'blocked';
  }

  const result = await request(CAMERA_PERMISSION);
  return mapResult(result);
}

export async function requestPhotoLibraryPermission(): Promise<PermissionStatus> {
  const status = await checkPhotoLibraryPermission();

  if (status === 'granted') return 'granted';

  if (status === 'blocked') {
    showBlockedAlert(
      'Photo Access Required',
      'SXM GO needs photo library access to set your profile picture. Please enable it in Settings.',
    );
    return 'blocked';
  }

  const result = await request(PHOTO_LIBRARY_PERMISSION);
  return mapResult(result);
}

// ── Utility ──

function showBlockedAlert(title: string, message: string): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => openSettings() },
  ]);
}

export { openSettings };
