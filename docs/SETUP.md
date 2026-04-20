# SXM GO - React Native Setup Guide

## Prerequisites

- Node.js >= 18
- npm or yarn
- React Native CLI (`npm install -g react-native`)
- For Android: Android Studio with SDK 33+, Java 17
- For iOS (macOS only): Xcode 15+, CocoaPods

## Initial Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Generate Native Projects

Since this project was created with source code but without native folders, you need to generate them:

```bash
# Option A: Use React Native Community CLI (recommended)
npx react-native eject

# Option B: If eject doesn't work, create native folders manually
npx react-native-init-native-app
```

**Alternative approach** - Copy from a fresh template:
```bash
# In a temporary directory, create a new RN project
npx react-native init TempProject --version 0.73.2

# Copy the native folders to your project
cp -r TempProject/android ./android
cp -r TempProject/ios ./ios

# Update the app name in native projects if needed
```

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your Supabase and OAuth credentials
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `GOOGLE_WEB_CLIENT_ID` - Google OAuth client ID (web)
- `GOOGLE_IOS_CLIENT_ID` - Google OAuth client ID (iOS)
- `FACEBOOK_APP_ID` - Facebook app ID

### 4. Platform-Specific Setup

#### Android

1. Open `android/` folder in Android Studio
2. Sync Gradle files
3. Add `react-native-config` plugin to `android/app/build.gradle`:
   ```gradle
   apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
   ```

#### iOS (macOS only)

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

Configure URL schemes in `ios/SxmGo/Info.plist` for OAuth callbacks.

### 5. Run the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## Native Module Configuration

### react-native-config

Android: Already configured via babel plugin. Just ensure the Gradle plugin is applied.

iOS: Add to `Info.plist` if needed for build-time config.

### react-native-keychain

Automatically linked. No additional configuration needed.

### Google Sign-In

1. Create OAuth credentials in Google Cloud Console
2. Add SHA-1 fingerprint for Android
3. Add iOS URL scheme: `com.googleusercontent.apps.YOUR_CLIENT_ID`

### Apple Sign-In (iOS)

1. Enable "Sign in with Apple" capability in Xcode
2. Configure in Apple Developer portal

### Facebook Login

1. Create app in Facebook Developers
2. Add Android key hash
3. Add iOS URL scheme: `fb{APP_ID}`

## Project Structure

```
mobile/
├── src/
│   ├── App.tsx           # Root component
│   ├── auth/             # Authentication module (Dev 1)
│   │   ├── components/   # Reusable auth UI components
│   │   ├── context/      # Auth state management
│   │   ├── hooks/        # Custom React hooks
│   │   ├── navigation/   # Auth & App navigators
│   │   ├── screens/      # Full-screen components
│   │   ├── services/     # API & business logic
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Validation, sanitization
│   └── shared/           # Shared across modules
│       ├── components/   # ErrorBoundary, Toast, etc.
│       └── config/       # App & Supabase config
├── tests/                # Jest unit tests
├── index.js              # App entry point
├── app.json              # React Native app config
├── babel.config.js       # Babel with module-resolver
├── metro.config.js       # Metro bundler config
└── package.json          # Dependencies & scripts
```

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## Backend Setup

The Supabase backend migrations are in `backend/auth/migrations/`. Run them in order:

```sql
-- Run in Supabase SQL Editor
\i 001_create_profiles.sql
\i 002_create_profile_on_signup.sql
\i 003_create_user_preferences.sql
\i 004_create_privacy_consent.sql
\i 005_create_deletion_requests.sql
\i 006_create_avatar_storage.sql
\i 007_rls_policies.sql
```

Deploy Edge Functions:
```bash
supabase functions deploy delete-account
supabase functions deploy export-user-data
supabase functions deploy process-deletions
```

## Troubleshooting

### Metro bundler cache issues
```bash
npm run start:reset
```

### Android build issues
```bash
cd android && ./gradlew clean && cd ..
```

### iOS pod issues
```bash
cd ios && rm -rf Pods && pod install && cd ..
```
