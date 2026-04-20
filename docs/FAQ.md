# FAQ — Services, APIs & Architecture

This document answers common questions about why specific services were chosen, how they are configured, and key technical considerations for the SXM GO project. Intended for developers and technical stakeholders.

---

## Authentication

**Q: Why Supabase Auth instead of Firebase Auth or AWS Cognito?**

Supabase Auth is built on the open-source GoTrue server and integrates natively with the Supabase PostgreSQL backend — eliminating a separate auth layer. It supports all required OAuth providers (Google, Apple, Facebook) plus email/password out of the box, and its Row Level Security (RLS) integration means auth decisions are enforced at the database layer rather than in application code. Firebase would require a separate Firestore instance with different query semantics. Cognito has significantly more complex setup for mobile OAuth flows and charges per monthly active user beyond the free tier.

---

**Q: How does Apple Sign-In work — and why is it iOS-only?**

Apple requires apps that offer third-party social login on iOS to also offer Sign In with Apple — it is not optional for App Store approval. The implementation uses `@invertase/react-native-apple-authentication`, which triggers Face ID / Touch ID and returns an `identityToken` (a JWT). This is passed to `supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })`, and Supabase verifies it against Apple's public keys.

Apple does not support Sign In with Apple on Android. The `authService.signInWithApple()` function guards against this with a `Platform.OS !== 'ios'` check and returns a graceful error on other platforms.

---

**Q: Where are auth tokens stored and how are they kept secure?**

The Supabase JS client uses `@react-native-async-storage/async-storage` to persist the session (access token + refresh token) between app launches. The access token is a short-lived JWT (1-hour expiry); the refresh token is long-lived and used automatically by the Supabase client to obtain new access tokens without user intervention.

Tokens are stored under Supabase's own AsyncStorage keys — they are base64-encoded JWTs, not plaintext passwords. For production hardening, the storage adapter could be swapped to `react-native-keychain` (Keychain on iOS, Android Keystore) for hardware-backed encryption.

---

**Q: What happens when a session expires mid-session?**

The Supabase client intercepts 401 responses and automatically calls the token refresh endpoint using the stored refresh token. On success, the new access token is persisted and the original request is retried transparently. If the refresh token itself is expired (e.g. user hasn't opened the app in 7+ days), the client fires a `SIGNED_OUT` event, the `AuthProvider` clears state, and the user is returned to the login screen.

---

**Q: Why is there a race condition guard (`initHandledRef`) in AuthProvider?**

On app startup, two things happen almost simultaneously: `init()` restores the session from AsyncStorage, and Supabase fires a `SIGNED_IN` auth state change event for the same session. Without the guard, both paths would independently fetch the user's profile and preferences from the database, resulting in duplicate network calls and the "Profile timeout" / "Preferences timeout" warnings seen in development. The `initHandledRef` flag tells the `SIGNED_IN` listener to skip the fetch if `init()` already handled it.

---

## Mapping

**Q: Why OpenStreetMap + Leaflet instead of Google Maps?**

Google Maps Platform charges per map load and interaction — at moderate usage this reaches $200–$500/month, which is prohibitive for an early-stage product. OpenStreetMap data is free and open under the ODbL licence. Leaflet is a lightweight, actively-maintained JavaScript mapping library.

This project uses **CartoDB Voyager** raster tiles, which provide a clean, Google-Maps-style visual appearance (roads, terrain, labels) at zero cost under CartoDB's free tier. The tradeoff is a WebView rendering layer — see the next question.

---

**Q: Why WebView for the map instead of a native react-native-maps or Mapbox component?**

Native map SDKs (`react-native-maps`, `@rnmapbox/maps`) require native module linking, add significant APK/IPA binary size, and have historically had breaking changes between React Native versions. The WebView approach keeps the entire map implementation in JavaScript/HTML with no native dependencies, making it easier to maintain, update behaviour (tile providers, marker styles, polylines), and debug without a native rebuild.

The performance tradeoff — a WebView has slightly more overhead than a native view — is acceptable for SXM GO's use case. The map is a secondary rendering layer (the FlatList-based location list is the primary interaction surface), and the WebView is reused across the session rather than recreated.

---

**Q: How accurate is the GPS check-in radius?**

The check-in radius is 150 metres (`CHECK_IN_RADIUS_METRES` in `fraudDetectionService.ts`). GPS accuracy on modern smartphones is typically 3–10 metres in open outdoor areas and 10–30 metres in dense urban environments. The fraud detection layer also validates the `accuracy` value reported by the GPS provider — readings with reported accuracy worse than 50 metres are rejected before the distance check runs.

The 150m radius was chosen to accommodate GPS drift on cruise ship passengers (who may be near but not exactly at a location) while still requiring physical presence rather than proximity from a hotel or ship.

---

**Q: Can the check-in radius be changed per location?**

Not currently — it is a single global constant. The database schema and fraud detection service are designed to support per-location radius overrides in a future iteration (the `locations` table can be extended with a `checkin_radius_metres` column, and `fraudDetectionService.validateCheckIn()` accepts the location object, making it straightforward to pass a per-location value).

---

## Database

**Q: Why PostgreSQL (Supabase) instead of a NoSQL database like Firestore?**

The SXM GO data model is highly relational:
- Users have profiles, check-ins, and itineraries.
- Check-ins reference locations.
- Itinerary items reference both itineraries and locations with an ordering.
- Friendships link pairs of users.
- Weekly challenge progress links users, challenges, and check-ins.

PostgreSQL's JOIN performance, foreign key constraints, and transactional integrity make it a natural fit. Supabase's real-time subscriptions (`postgres_changes`) allow leaderboard and profile updates to push instantly to clients without polling — matching the "Firestore-style" real-time experience while keeping the full power of SQL.

---

**Q: What is Row Level Security (RLS) and why is it on every table?**

RLS is a PostgreSQL feature that filters rows at the database level based on the authenticated user's identity (`auth.uid()`). Every user-data table in SXM GO has RLS enabled with explicit policies — for example:
- A user can only `SELECT`/`UPDATE` their own profile row.
- A user can only `INSERT` check-ins for themselves.
- A user can only read activities where `user_id = auth.uid()`.

This is critical because the Supabase `anon` key (used in the mobile app) is client-side and cannot be kept secret. RLS ensures that even with the key exposed, no user can access or modify another user's private data directly at the database level — application-layer auth checks alone are insufficient.

---

**Q: Why are friendships stored as two rows (both directions)?**

The `friendships` table stores both `(user_id=A, friend_id=B)` and `(user_id=B, friend_id=A)` when a friendship is accepted. This makes "get all friends of user A" a simple `WHERE user_id = A` query with no UNION or OR clause, which is easier to apply RLS policies to and performs predictably with a simple index. The storage cost (2× rows) is negligible compared to the query simplicity gained.

---

**Q: Why are `route_points` stored as JSONB in the activities table rather than a separate table?**

Route points are always read and written together as a unit — there is no use case for querying individual points in isolation. Storing them as a JSONB array avoids a join and keeps activity reads as a single row fetch. For very long routes (1000+ points), a separate table would be more appropriate, but for typical walking/exploration sessions of 1–3 hours at one point per 10 metres of movement, the JSONB approach is practical and avoids schema complexity.

---

## Offline & Sync

**Q: How does offline check-in work end-to-end?**

1. `isOnline()` probes the network by attempting a lightweight fetch.
2. If offline, `checkIn()` calls `queueOfflineCheckIn()`, which serialises the check-in (location ID, timestamp, GPS position) to AsyncStorage under the `pending_check_ins` key.
3. The Map screen shows a pending banner with the count.
4. The next time the user opens the Map tab (which calls `getLocations()`), `syncPendingCheckIns()` is invoked — it replays each queued check-in against the live Supabase API in order and clears the queue on success.
5. Failed syncs (e.g. location no longer valid) are logged and removed from the queue rather than retried indefinitely.

---

**Q: How is location data cached?**

`cacheLocations()` serialises the full locations array to AsyncStorage with a `cachedAt` timestamp. `getCachedLocations()` checks the age on read — if older than 24 hours, it returns `null` and the caller fetches fresh data. This gives users a full offline map experience for a day without signal, which covers the typical cruise passenger or resort guest use case.

---

## Push Notifications

**Q: Why is the current notification service a local scaffold rather than a live push provider?**

The `notificationService.ts` implementation stores device tokens and a notification history locally in AsyncStorage as a development scaffold. This allows the full notification triggering logic (badge earned, challenge complete, leaderboard rank change, check-in confirmed) to be wired up and tested end-to-end without a live push infrastructure dependency during development.

In production, this layer would be replaced with:
- **Firebase Cloud Messaging (FCM)** for Android
- **Apple Push Notification service (APNs)** for iOS
- **Supabase Edge Functions** as the server-side trigger (called by database webhooks on badge/challenge events)

The service interface is designed to support this swap without changing any call sites — only the implementation of `registerDeviceToken()` and the internal send logic would change.

---

## Anti-Fraud

**Q: How does the app detect fake GPS locations?**

Three checks run on every check-in attempt via `fraudDetectionService.validateCheckIn()`:

1. **Mock location flag (Android):** The GPS provider sets `mockProvider = true` on the location object when Android's "Allow mock locations" developer option is active and a mock GPS app is running. This is caught by `getValidatedGpsPosition()`.

2. **Teleport detection:** The service compares the current position timestamp and coordinates against the last recorded position. If the user has moved more than 500 metres in under 30 seconds (implying instant teleportation rather than physical travel), the check-in is flagged.

3. **Speed check:** The speed between the last two known positions is calculated. If it exceeds 120 km/h, the check-in is flagged — this threshold catches driving while faking proximity but allows fast ferry travel between island halves.

Flagged check-ins are recorded in the `flagged_check_ins` table for manual review. They still provisionally award points to avoid penalising legitimate users hit by GPS drift — the admin review process determines whether to reverse the points.

---

## Performance

**Q: Why were `React.memo` and `useCallback` added to FlatList screens?**

React Native's `VirtualizedList` (the engine behind `FlatList`) re-renders every visible row whenever the parent component re-renders. In screens like MapScreen and LeaderboardScreen, state changes (loading flags, toast visibility, refreshing) caused the parent to re-render frequently, which re-created inline `renderItem` arrow functions on every render — forcing FlatList to treat every row as changed and re-render them all.

The fix: extract `renderItem` into `React.memo` components defined outside the parent, and wrap callback props in `useCallback`. This means FlatList rows only re-render when their own data changes. Additional props (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, `removeClippedSubviews`, `getItemLayout`) tune the rendering window to match the visible area.

---

**Q: Why use Haversine for distance calculation rather than a mapping API?**

Haversine is a pure mathematical formula for calculating the great-circle distance between two GPS coordinates. It runs synchronously in JavaScript with no network dependency, no API cost, and no latency. For the use cases in SXM GO — check-in radius validation (is user within 150m?) and activity route distance accumulation (sum of segments) — Haversine is accurate to within 0.5% at the distances involved (metres to kilometres on a small island). A mapping API route distance would give road-following distance, which is irrelevant for "as-the-crow-flies" proximity checks.
