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
    try {
      return await secureStorage.get(key);
    } catch (e) {
      console.warn('[SupabaseClient] Failed to get from storage:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Non-blocking set to prevent slow storage from timing out login
      secureStorage.set(key, value).catch(e => 
        console.warn('[SupabaseClient] Failed to set storage:', e)
      );
    } catch (e) {
      console.warn('[SupabaseClient] Immediate storage failure:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await secureStorage.remove(key);
    } catch (e) {
      console.warn('[SupabaseClient] Failed to remove from storage:', e);
    }
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
