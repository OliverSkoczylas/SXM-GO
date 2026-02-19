// OAuth provider initialization
// FR-001: Configure Google Sign-In and Facebook SDK for native auth flows.
// Must be called once before any social login attempt (e.g. in App.tsx or AuthProvider).

import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

let initialized = false;

export function initializeOAuthProviders(): void {
  if (initialized) return;

  // Google Sign-In requires the *web* client ID (not Android client ID).
  // The web client ID is used to request an ID token that Supabase can verify.
  GoogleSignin.configure({
    webClientId: Config.GOOGLE_WEB_CLIENT_ID || '',
    offlineAccess: false,
  });

  // Facebook SDK is auto-initialized via AndroidManifest meta-data on Android
  // and Info.plist on iOS - no JS-side init needed.

  initialized = true;
}
