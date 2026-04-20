# Deployment & Run Guide

This guide covers everything required to run, build, and deploy the SXM GO mobile application — including all required API keys, OAuth configuration, and the full deployment workflow for Android and iOS.

---

## 1. Prerequisites

Ensure the following are installed before proceeding:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18 LTS+ | JavaScript runtime |
| npm | 9+ | Package manager |
| Watchman | Latest | File watcher for Metro bundler (macOS) |
| Java (JDK) | 17 | Android build toolchain |
| Android Studio | Hedgehog+ | Android SDK, emulator, ADB |
| Xcode | 15+ | iOS builds (macOS only) |
| CocoaPods | 1.14+ | iOS dependency manager |
| Git | 2.x+ | Version control |

---

## 2. Required API Keys & Environment Variables

### Supabase (Backend)

Obtain from: [supabase.com](https://supabase.com) → Your Project → **Settings → API**

| Variable | Where to set |
|----------|-------------|
| `SUPABASE_URL` | `mobile/src/shared/config/supabase.config.ts` |
| `SUPABASE_ANON_KEY` | `mobile/src/shared/config/supabase.config.ts` |

```ts
// mobile/src/shared/config/supabase.config.ts
export const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_KEY_HERE',
};
```

> **Note:** The anon key is safe to include in the mobile app — Supabase Row Level Security (RLS) policies enforce per-user data access at the database level regardless of the key.

---

### Google Sign-In

Obtain from: [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials → Create OAuth 2.0 Client ID**

Create three client IDs:

| Client Type | Variable | Destination file |
|-------------|----------|-----------------|
| Web | `GOOGLE_WEB_CLIENT_ID` | `mobile/src/auth/services/oauthConfig.ts` |
| Android | `GOOGLE_ANDROID_CLIENT_ID` | `mobile/android/app/google-services.json` |
| iOS | `GOOGLE_IOS_CLIENT_ID` | `mobile/ios/SxmGo/GoogleService-Info.plist` |

Steps:
1. Create a project in Google Cloud Console.
2. Enable the **Google Sign-In API** (under APIs & Services → Library).
3. Create an OAuth 2.0 Web client ID — this is used by Supabase server-side.
4. Create an Android OAuth client ID — requires your app's **SHA-1 fingerprint** (get it via `cd android && ./gradlew signingReport`).
5. Create an iOS OAuth client ID — requires your **Bundle ID** (e.g. `com.sxmgo.app`).
6. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) and place in the paths above.
7. Enable the Google provider in **Supabase Dashboard → Authentication → Providers → Google**, pasting the Web Client ID and secret.

---

### Facebook Login

Obtain from: [Meta for Developers](https://developers.facebook.com) → **My Apps → Create App → Facebook Login**

| Value | Destination |
|-------|-------------|
| App ID | `mobile/android/app/src/main/res/values/strings.xml` |
| App ID | `mobile/ios/SxmGo/Info.plist` |
| App Secret | Supabase Dashboard → Authentication → Providers → Facebook |

Steps:
1. Create a Meta app at developers.facebook.com.
2. Add the **Facebook Login** product.
3. Add your Android package name and iOS Bundle ID in the Facebook app settings.
4. Enable the Facebook provider in **Supabase Dashboard → Authentication → Providers → Facebook**.

---

### Apple Sign-In (iOS only)

No API key is required client-side. Configuration is done via Apple Developer Portal and Xcode:

1. Sign in to [Apple Developer Portal](https://developer.apple.com).
2. Go to **Identifiers** → select your App ID → enable **Sign In with Apple**.
3. In Xcode → your target → **Signing & Capabilities** → add **Sign In with Apple**.
4. In Supabase Dashboard → **Authentication → Providers → Apple**, add your:
   - **Services ID** (create under Identifiers → Services IDs)
   - **Team ID** (top-right of Apple Developer account)
   - **Key ID + private key** (create under Keys → Sign In with Apple)

---

## 3. OAuth Server Workflow

### Google OAuth Flow

```
User taps "Continue with Google"
    │
    ▼
@react-native-google-signin opens native Google account picker
    │
    ▼
Google returns idToken (JWT signed by Google)
    │
    ▼
supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
    │
    ▼
Supabase verifies idToken against Google's public keys
    │
    ▼
Supabase creates or retrieves user record
    │
    ▼
Supabase returns session { access_token, refresh_token, user }
    │
    ▼
AuthProvider stores session → app navigates to Map
```

---

### Apple Sign-In Flow (iOS only)

```
User taps "Continue with Apple"
    │
    ▼
@invertase/react-native-apple-authentication triggers Face ID / Touch ID
    │
    ▼
Apple returns identityToken (JWT) + optional nonce
    │
    ▼
supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken, nonce })
    │
    ▼
Supabase verifies JWT against Apple's public keys
    │
    ▼
Supabase creates or retrieves user → returns session
    │
    ▼
AuthProvider stores session → app navigates to Map
```

---

### Facebook OAuth Flow

```
User taps "Continue with Facebook"
    │
    ▼
react-native-fbsdk-next opens Facebook login dialog
    │
    ▼
Facebook returns accessToken
    │
    ▼
supabase.auth.signInWithIdToken({ provider: 'facebook', token: accessToken })
    │
    ▼
Supabase exchanges accessToken with Facebook Graph API to verify identity
    │
    ▼
Supabase creates or retrieves user → returns session
    │
    ▼
AuthProvider stores session → app navigates to Map
```

---

### Email / Password Flow

```
User submits email + password
    │
    ▼
supabase.auth.signUp() or supabase.auth.signInWithPassword()
    │
    ▼
Supabase validates credentials / creates account
    │
    ▼
Database trigger handle_new_user() fires (on sign-up) → creates profiles row
    │
    ▼
Supabase returns session
    │
    ▼
AuthProvider stores session → app navigates to Map
```

---

## 4. Running the App Locally

### 1. Clone and install

```bash
git clone https://github.com/OliverSkoczylas/SXM-GO.git
cd SXM-GO/mobile
npm install
```

### 2. iOS (macOS only)

```bash
cd ios && pod install && cd ..
npm run ios
```

### 3. Android

Ensure an emulator is running (or a physical device is connected via USB with ADB):

```bash
npm run android
```

### 4. Start Metro bundler separately

```bash
npm start
# or to clear the cache:
npm run start:reset
```

---

## 5. Running Database Migrations

All database schema is in `/backend/auth/migrations/` as numbered SQL files (001 through 016).

**Steps:**
1. Log in to [supabase.com](https://supabase.com) → open your project.
2. Go to **SQL Editor**.
3. Run each migration file in numeric order — `001_...` through `016_...`.
4. Order is critical: later migrations reference tables created in earlier ones (foreign key dependencies).

**Migration summary:**

| File | Creates |
|------|---------|
| 001–006 | profiles, preferences, privacy consent, avatars |
| 007 | RLS policies |
| 008 | Leaderboard tables |
| 009 | Locations table (55+ seeded locations) |
| 010 | Groups tables |
| 011 | Itinerary tables |
| 012 | Challenges, badges, progress |
| 013 | Fraud detection, notifications, additional locations |
| 014 | Streaks, weekly challenges, itinerary stats |
| 015 | Activity tracking (GPS routes) |
| 016 | Social/friends, location detail columns |

---

## 6. Production Deployment

### Android

```bash
cd mobile/android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
# Or for App Bundle (recommended for Play Store):
./gradlew bundleRelease
```

Upload the `.apk` or `.aab` to [Google Play Console](https://play.google.com/console).

### iOS

1. Open `mobile/ios/SxmGo.xcworkspace` in Xcode.
2. Select **Any iOS Device** as the build target.
3. **Product → Archive**.
4. In the Organizer window, click **Distribute App → App Store Connect**.
5. Follow the prompts to upload to [App Store Connect](https://appstoreconnect.apple.com).

### Supabase

- Maintain separate Supabase projects for **development** and **production**.
- Apply all 016 migrations to the production project before submitting the app.
- Ensure RLS is enabled on all tables (verified by running `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` in the SQL editor).
- Set Auth redirect URLs for your production domain in **Supabase Dashboard → Authentication → URL Configuration**.

---

## 7. Environment Checklist

Before submitting to App Store / Play Store, verify:

- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` point to production project
- [ ] Google `google-services.json` is the production version (SHA-1 from release keystore)
- [ ] Apple Sign-In Services ID is configured for production Bundle ID
- [ ] Facebook App is set to Live mode (not Development)
- [ ] All 016 database migrations applied to production Supabase
- [ ] RLS enabled on all tables
- [ ] Push notification certificates/keys configured (FCM for Android, APNs for iOS)
- [ ] App version number incremented in `mobile/android/app/build.gradle` and `mobile/ios/SxmGo/Info.plist`
