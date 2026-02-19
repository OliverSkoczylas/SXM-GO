// Hook for location permission state (UX-004)
// Re-checks permission when the app comes back to foreground (user may have changed it in Settings).

import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  checkLocationPermission,
  requestLocationPermission,
  PermissionStatus,
} from '../services/permissionService';

export function useLocationPermission() {
  const [status, setStatus] = useState<PermissionStatus | null>(null);

  const refresh = useCallback(async () => {
    const result = await checkLocationPermission();
    setStatus(result);
  }, []);

  // Check on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-check when app returns from background (user may have toggled in Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    const result = await requestLocationPermission();
    setStatus(result);
    return result;
  }, []);

  return {
    status,
    isGranted: status === 'granted',
    isBlocked: status === 'blocked',
    requestPermission,
    refresh,
  };
}
