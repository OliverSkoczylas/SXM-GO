// OAuth provider initialization
// FR-001: Configure Google Sign-In and Facebook SDK for native auth flows.
// Must be called once before any social login attempt (e.g. in App.tsx or AuthProvider).

let initialized = false;

export function initializeOAuthProviders(): void {
  if (initialized) return;

  try {
    // Google Sign-In requires the *web* client ID (not Android client ID).
    // The web client ID is used to request an ID token that Supabase can verify.
    const Config = require('react-native-config').default;
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');

    const webClientId = Config?.GOOGLE_WEB_CLIENT_ID || '';
    if (webClientId && !webClientId.startsWith('your-')) {
      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
      });
    }
  } catch (e) {
    // OAuth native modules not available yet — social login buttons will
    // show an error if tapped, but the app won't crash on startup.
    console.warn('OAuth providers not initialized:', e);
  }

  // Facebook SDK is auto-initialized via AndroidManifest meta-data on Android
  // and Info.plist on iOS - no JS-side init needed.

  initialized = true;
}
