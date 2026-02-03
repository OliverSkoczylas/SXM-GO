// Hook for handling location permission flow
// UX-004: Request location permission with clear explanation
// FR-007: Location data only with explicit permission
// FR-008: Pause/disable location tracking

import { useState, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

export function useLocationPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [showExplanation, setShowExplanation] = useState(false);

  const permission: Permission = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  })!;

  const checkPermission = useCallback(async () => {
    const result = await check(permission);
    switch (result) {
      case RESULTS.GRANTED:
      case RESULTS.LIMITED:
        setStatus('granted');
        break;
      case RESULTS.DENIED:
        setStatus('denied');
        break;
      case RESULTS.BLOCKED:
      case RESULTS.UNAVAILABLE:
        setStatus('blocked');
        break;
      default:
        setStatus('undetermined');
    }
    return result;
  }, [permission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await request(permission);
    const granted = result === RESULTS.GRANTED || result === RESULTS.LIMITED;
    setStatus(granted ? 'granted' : 'denied');
    return granted;
  }, [permission]);

  const promptForPermission = useCallback(() => {
    setShowExplanation(true);
  }, []);

  const dismissExplanation = useCallback(() => {
    setShowExplanation(false);
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return {
    status,
    showExplanation,
    checkPermission,
    requestPermission,
    promptForPermission,
    dismissExplanation,
    openSettings,
  };
}
