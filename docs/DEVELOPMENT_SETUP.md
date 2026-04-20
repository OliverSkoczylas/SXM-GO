# Development Environment Setup

This guide walks through setting up a complete local development environment for SXM GO from scratch.

---

## 1. System Requirements

| Requirement | macOS | Windows | Linux |
|-------------|-------|---------|-------|
| Node.js 18 LTS | ✅ | ✅ | ✅ |
| Android development | ✅ | ✅ | ✅ |
| iOS development | ✅ only | ❌ | ❌ |
| Watchman | Recommended | Optional | Optional |

---

## 2. Installing Core Tools

### Node.js

Download Node.js 18 LTS from [nodejs.org](https://nodejs.org) or use a version manager:

```bash
# macOS/Linux — using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
nvm use 18

# Windows — using nvm-windows
# Download installer from: https://github.com/coreybutler/nvm-windows
nvm install 18.0.0
nvm use 18.0.0
```

Verify: `node --version` should output `v18.x.x`

### Watchman (macOS — strongly recommended)

```bash
brew install watchman
```

Watchman prevents Metro bundler file-watching issues on macOS with large projects.

---

## 3. Android Setup

### Step 1 — Install Android Studio

Download from [developer.android.com/studio](https://developer.android.com/studio). Install **Android Studio Hedgehog (2023.1.1)** or later.

### Step 2 — Install SDK components

Open Android Studio → **SDK Manager** (via More Actions on the Welcome screen, or Tools → SDK Manager):

- **SDK Platforms tab:** Install API Level **26, 33, 34**
- **SDK Tools tab:** Install:
  - Android SDK Build-Tools 34.0.0
  - Android Emulator
  - Android SDK Platform-Tools
  - Intel x86 Emulator Accelerator (HAXM) — Windows/macOS Intel only

### Step 3 — Configure environment variables

**macOS/Linux** — add to `~/.zshrc` or `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk          # macOS
# export ANDROID_HOME=$HOME/Android/Sdk               # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Then reload: `source ~/.zshrc`

**Windows** — via System Properties → Environment Variables:
- New system variable: `ANDROID_HOME` = `C:\Users\<YourName>\AppData\Local\Android\Sdk`
- Edit `Path` → Add:
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\emulator`

### Step 4 — Accept SDK licences

```bash
sdkmanager --licenses
# Press 'y' to accept each licence
```

### Step 5 — Create an Android Virtual Device (AVD)

Open Android Studio → **Virtual Device Manager** → **Create Device**:
- Hardware: **Pixel 7** (recommended)
- System Image: **API 33 (Android 13)**, x86_64
- Finish → Start the emulator before running `npm run android`

### Step 6 — Java 17

React Native 0.73 requires Java 17. Android Studio ships with a bundled JDK — to use it:

```bash
# macOS — add to ~/.zshrc:
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
```

Or install separately: [Adoptium Temurin 17](https://adoptium.net)

Verify: `java -version` should output `openjdk 17.x.x`

---

## 4. iOS Setup (macOS only)

### Step 1 — Install Xcode

Install Xcode 15+ from the **Mac App Store**. This is a large download (~15 GB).

### Step 2 — Install Command Line Tools

```bash
xcode-select --install
sudo xcodebuild -license accept
```

### Step 3 — Install CocoaPods

```bash
# Option A — via RubyGems (system Ruby):
sudo gem install cocoapods

# Option B — via Homebrew (recommended, avoids sudo):
brew install cocoapods
```

Verify: `pod --version` should output `1.14.x` or later.

---

## 5. Project Setup

### Clone and install

```bash
git clone https://github.com/OliverSkoczylas/SXM-GO.git
cd SXM-GO/mobile
npm install
```

### iOS — install native dependencies

```bash
cd ios
pod install
cd ..
```

Run this after every `npm install` that adds or updates native modules.

---

## 6. Project Structure

```
sxmgo/
├── backend/
│   └── auth/
│       └── migrations/       # SQL files 001–016 (run in order on Supabase)
├── docs/                     # This documentation
├── mobile/
│   ├── android/              # Native Android project
│   ├── ios/                  # Native iOS project
│   └── src/
│       ├── App.tsx           # Root component
│       ├── auth/
│       │   ├── components/   # Shared UI components
│       │   ├── context/      # AuthProvider, AuthContext
│       │   ├── hooks/        # useAuth, useProfile, etc.
│       │   ├── navigation/   # AppNavigator, AuthNavigator, RootNavigator
│       │   ├── screens/      # All screen components
│       │   ├── services/     # Supabase service modules
│       │   ├── types/        # TypeScript type definitions
│       │   └── utils/        # Validation, helpers
│       └── shared/
│           ├── components/   # Toast, ErrorBoundary, LoadingSpinner
│           ├── config/       # supabase.config.ts
│           └── i18n/         # Translation keys (EN/NL/ES/FR)
└── REQUIREMENTS.md
```

---

## 7. Dependency Overview

### Core

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native` | 0.73.2 | Mobile framework |
| `react` | 18.2.0 | UI library |
| `typescript` | 5.3.x | Type safety |

### Navigation

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` | Navigation core |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `@react-navigation/native-stack` | Stack navigator |
| `react-native-screens` | Native screen optimisation |
| `react-native-safe-area-context` | Safe area insets |

### Backend & Storage

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client (auth, DB, realtime, storage) |
| `@react-native-async-storage/async-storage` | Offline cache, session persistence |

### Authentication & OAuth

| Package | Purpose |
|---------|---------|
| `@react-native-google-signin/google-signin` | Google OAuth |
| `@invertase/react-native-apple-authentication` | Apple Sign-In (iOS) |
| `react-native-fbsdk-next` | Facebook OAuth |

### Maps & UI

| Package | Purpose |
|---------|---------|
| `react-native-webview` | Leaflet map rendering |
| `react-native-svg` | Custom SVG tab icons |

### Validation & Utilities

| Package | Purpose |
|---------|---------|
| `zod` | Schema validation for forms |

---

## 8. Configuring Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Settings → API** and copy your Project URL and anon key.
3. Open `mobile/src/shared/config/supabase.config.ts` and fill in your values:

```ts
export const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_KEY_HERE',
};
```

4. Run database migrations in order from `/backend/auth/migrations/` via the Supabase SQL Editor.

> **Free tier note:** Supabase pauses inactive projects after 1 week. If you see "Network request failed" errors, visit your Supabase dashboard and click **Restore project**.

---

## 9. Configuring Google Sign-In

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
2. Enable the **Google Sign-In API**.
3. Create OAuth 2.0 credentials — Web, Android (requires SHA-1), and iOS (requires Bundle ID).
4. Update `mobile/src/auth/services/oauthConfig.ts` with your Web Client ID.
5. Place `google-services.json` in `mobile/android/app/`.
6. Place `GoogleService-Info.plist` in `mobile/ios/SxmGo/`.
7. Enable Google provider in **Supabase Dashboard → Authentication → Providers → Google**.

**Getting your debug SHA-1 (Android):**

```bash
cd mobile/android
./gradlew signingReport
# Look for "SHA1:" under "Variant: debug"
```

---

## 10. Configuring Apple Sign-In (macOS / iOS only)

1. In Xcode → your target → **Signing & Capabilities** → **+ Capability** → add **Sign In with Apple**.
2. In [Apple Developer Portal](https://developer.apple.com) → Identifiers → your App ID → enable Sign In with Apple.
3. Create a Services ID and a Sign In with Apple key.
4. In **Supabase Dashboard → Authentication → Providers → Apple**, add your Team ID, Services ID, Key ID, and private key contents.

---

## 11. Configuring Facebook Login

1. Create an app at [developers.facebook.com](https://developers.facebook.com).
2. Add the **Facebook Login** product.
3. Add your Android package name (`com.sxmgo`) and iOS Bundle ID.
4. Add your App ID to:
   - `mobile/android/app/src/main/res/values/strings.xml`
   - `mobile/ios/SxmGo/Info.plist`
5. Enable Facebook provider in **Supabase Dashboard → Authentication → Providers → Facebook** with your App ID and App Secret.

---

## 12. Available Scripts

Run from the `mobile/` directory:

```bash
npm start              # Start Metro bundler
npm run start:reset    # Start Metro with cleared cache
npm run android        # Build and run on Android device/emulator
npm run ios            # Build and run on iOS simulator
npm run typecheck      # TypeScript type checking (tsc --noEmit)
npm run lint           # ESLint
npm test               # Run Jest unit tests
npm run test:watch     # Jest in watch mode
npm run test:coverage  # Jest with coverage report
npm run clean          # Clean Gradle cache + node_modules cache
```

---

## 13. Troubleshooting

| Problem | Solution |
|---------|----------|
| `Unable to load script from assets` | Metro is not running — run `npm start` first |
| `ADB not found` | Check `ANDROID_HOME` and PATH are set correctly; restart terminal |
| `pod install` fails | Run `pod repo update` then retry; ensure CocoaPods is up to date |
| `Network request failed` (Supabase) | Supabase project may be paused — visit dashboard and click Restore |
| Build fails on wrong directory | Always run commands from `sxmgo/mobile/`, not a nested path |
| `Gradle could not find Java` | Set `JAVA_HOME` to JDK 17; verify with `java -version` |
| Google Sign-In `DEVELOPER_ERROR` | SHA-1 fingerprint mismatch — regenerate and update Google Cloud Console |
| White screen on launch | Check Metro logs for JS errors; run `npm run start:reset` |
| iOS build code signing error | Check Apple Developer account membership and provisioning profiles in Xcode |
