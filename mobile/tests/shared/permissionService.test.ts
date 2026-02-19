// Tests for permission handling service (UX-004)

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 33, select: (obj: any) => obj.android },
  Alert: { alert: jest.fn() },
  Linking: { openSettings: jest.fn() },
}));

const mockCheck = jest.fn();
const mockRequest = jest.fn();
const mockOpenSettings = jest.fn();

jest.mock('react-native-permissions', () => ({
  check: mockCheck,
  request: mockRequest,
  openSettings: mockOpenSettings,
  PERMISSIONS: {
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      CAMERA: 'android.permission.CAMERA',
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
    LIMITED: 'limited',
  },
}));

import {
  checkLocationPermission,
  requestLocationPermission,
  checkCameraPermission,
  requestCameraPermission,
  requestPhotoLibraryPermission,
} from '../../src/shared/services/permissionService';
import { Alert } from 'react-native';

describe('permissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLocationPermission', () => {
    it('returns granted when permission is granted', async () => {
      mockCheck.mockResolvedValueOnce('granted');
      const result = await checkLocationPermission();
      expect(result).toBe('granted');
    });

    it('returns denied when permission is denied', async () => {
      mockCheck.mockResolvedValueOnce('denied');
      const result = await checkLocationPermission();
      expect(result).toBe('denied');
    });

    it('returns blocked when permission is blocked', async () => {
      mockCheck.mockResolvedValueOnce('blocked');
      const result = await checkLocationPermission();
      expect(result).toBe('blocked');
    });
  });

  describe('requestLocationPermission', () => {
    it('returns granted immediately if already granted', async () => {
      mockCheck.mockResolvedValueOnce('granted');
      const result = await requestLocationPermission();
      expect(result).toBe('granted');
      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('requests permission when denied and returns result', async () => {
      mockCheck.mockResolvedValueOnce('denied');
      mockRequest.mockResolvedValueOnce('granted');
      const result = await requestLocationPermission();
      expect(result).toBe('granted');
      expect(mockRequest).toHaveBeenCalled();
    });

    it('shows settings alert when blocked', async () => {
      mockCheck.mockResolvedValueOnce('blocked');
      const result = await requestLocationPermission();
      expect(result).toBe('blocked');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Permission Required',
        expect.stringContaining('check-ins'),
        expect.any(Array),
      );
    });
  });

  describe('requestCameraPermission', () => {
    it('returns granted when already granted', async () => {
      mockCheck.mockResolvedValueOnce('granted');
      const result = await requestCameraPermission();
      expect(result).toBe('granted');
    });

    it('shows settings alert when blocked', async () => {
      mockCheck.mockResolvedValueOnce('blocked');
      const result = await requestCameraPermission();
      expect(result).toBe('blocked');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Camera Permission Required',
        expect.stringContaining('profile photos'),
        expect.any(Array),
      );
    });
  });

  describe('requestPhotoLibraryPermission', () => {
    it('requests permission when denied', async () => {
      mockCheck.mockResolvedValueOnce('denied');
      mockRequest.mockResolvedValueOnce('granted');
      const result = await requestPhotoLibraryPermission();
      expect(result).toBe('granted');
    });

    it('maps limited to granted', async () => {
      mockCheck.mockResolvedValueOnce('limited');
      const result = await requestPhotoLibraryPermission();
      expect(result).toBe('granted');
    });
  });
});
