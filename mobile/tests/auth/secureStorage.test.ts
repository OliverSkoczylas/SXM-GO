// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
}));

import * as Keychain from 'react-native-keychain';
import { secureStorage } from '../../src/auth/services/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('stores a value in keychain with correct service name', async () => {
      await secureStorage.set('test-key', 'test-value');
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        expect.objectContaining({
          service: 'com.sxmgo.auth.test-key',
          accessible: 'WhenUnlockedThisDeviceOnly',
        }),
      );
    });
  });

  describe('get', () => {
    it('returns value when credentials exist', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
        username: 'test-key',
        password: 'test-value',
      });
      const result = await secureStorage.get('test-key');
      expect(result).toBe('test-value');
    });

    it('returns null when no credentials exist', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
      const result = await secureStorage.get('missing-key');
      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('fail'));
      const result = await secureStorage.get('error-key');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('calls resetGenericPassword with correct service', async () => {
      await secureStorage.remove('test-key');
      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'com.sxmgo.auth.test-key',
      });
    });

    it('does not throw on error', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('fail'));
      await expect(secureStorage.remove('error-key')).resolves.toBeUndefined();
    });
  });

  describe('clearAll', () => {
    it('removes the auth token key', async () => {
      await secureStorage.clearAll();
      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
    });
  });
});
