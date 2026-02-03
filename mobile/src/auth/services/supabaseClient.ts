// Singleton Supabase client with Keychain-backed session storage
// FR-004: Persistent sessions across app restarts
// TR-026: Tokens stored in iOS Keychain / Android Keystore

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../../shared/config/supabase.config';
import { secureStorage } from './secureStorage';

// Custom storage adapter using Keychain/Keystore instead of AsyncStorage.
// Supabase JS client calls these methods to persist/restore sessions.
const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return secureStorage.get(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await secureStorage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await secureStorage.remove(key);
  },
};

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        storage: SecureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // React Native does not use URL-based auth
      },
    });
  }
  return client;
}
