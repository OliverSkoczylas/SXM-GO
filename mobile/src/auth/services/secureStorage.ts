// Secure token storage using iOS Keychain / Android Keystore
// TR-026: All authentication tokens stored in the OS secure enclave.
// This module wraps react-native-keychain to provide a key-value interface
// compatible with Supabase's custom storage adapter requirements.

import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'com.sxmgo.auth';
const KEYCHAIN_TIMEOUT_MS = 5000;

// Wraps a Keychain promise with a timeout so a hung Keystore never blocks auth.
function withKeychainTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Keychain timeout')), KEYCHAIN_TIMEOUT_MS),
    ),
  ]);
}

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const credentials = await withKeychainTimeout(
        Keychain.getGenericPassword({ service: `${SERVICE_PREFIX}.${key}` }),
      );
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await withKeychainTimeout(
        Keychain.setGenericPassword(key, value, {
          service: `${SERVICE_PREFIX}.${key}`,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          // WHEN_UNLOCKED_THIS_DEVICE_ONLY: token is not included in backups
          // and is only accessible when the device is unlocked.
        }),
      );
    } catch (err: any) {
      console.warn('[SecureStorage] set failed (session will not persist):', err?.message);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await withKeychainTimeout(
        Keychain.resetGenericPassword({ service: `${SERVICE_PREFIX}.${key}` }),
      );
    } catch {
      // Ignore errors when removing non-existent keys
    }
  },

  async clearAll(): Promise<void> {
    const keys = [
      'sb-auth-token',
    ];
    await Promise.all(keys.map((k) => this.remove(k)));
  },
};
