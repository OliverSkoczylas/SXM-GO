# SXM GO - Frequently Asked Questions (FAQs)

**Author:** Paul Han
**Version:** 1.1  
**Last Updated:** April 2026

---

## 1. Authentication & Sessions

### Why am I signed out or why didn’t my session restore?
SXM GO uses **OAuth 2.0 tokens** stored in the device's secure enclave (Keychain on iOS, Keystore on Android). Sessions may fail to restore if:
*   The refresh token has expired (typically after 30 days of inactivity).
*   The device's secure storage was cleared or is being blocked by a system-level security update.
*   Clock synchronization issues between your device and our servers.
**Solution:** Force close the app and reopen. If prompted, sign in again to generate a new secure session.

### Why is social login (Google, Apple, Facebook) not working?
Social login requires a handshake between our app, the Supabase backend, and the provider's API. Common failure points include:
*   **Missing Redirects:** Ensure you are not using a private/incognito browser as the default on your device.
*   **Account Mismatch:** If you previously signed up with Email/Password using the same email address, the social login may be blocked for security.
*   **Provider Downtime:** Occasionally, Apple or Google services experience brief outages.
**Solution:** Check your internet connection. If the issue persists, try the "Forgot Password" flow with your social email to link an email/password login as a fallback.

---

## 2. Map & Location Services

### Why can’t I see my location on the map?
The map relies on **High Accuracy GPS (Fine Location)**. If your location isn't appearing:
*   **Permission Status:** You may have granted "Approximate" rather than "Precise" location.
*   **System Settings:** Low Power Mode or Data Saver Mode can restrict background GPS updates.
*   **Signal Blockage:** Tall buildings or dense foliage in areas like Philipsburg or the hills of St. Maarten can degrade GPS signals.
**Solution:** Ensure "Precise Location" is enabled in your device settings for SXM GO.

### Why won't the map load?
We use OpenStreetMap (OSM) via Leaflet. If the map tiles are missing:
*   You may be in a "dead zone" with poor cellular reception.
*   Your device's local cache for map tiles may be corrupted.
**Solution:** Check your connection. The map caches tiles you've previously viewed, so try browsing the island while on Wi-Fi before heading out to remote beaches.

---

## 3. Check-ins & Gamification

### Why can't I check in at a location?
To ensure fair play and prevent "sofa traveling," we enforce two strict rules:
1.  **Proximity:** You must be within **100 meters** of the location's coordinates.
2.  **Cooldown:** You can only check in at the same location once every **24 hours**.
**Solution:** Open the Map screen, tap the location pin, and check the "Distance" indicator. If you are within 100m and still can't check in, ensure your GPS hasn't "drifted."

### Why didn't I get points for my check-in?
Points are awarded via a backend trigger. If your points didn't update:
*   **Sync Latency:** High traffic on the leaderboard may cause a 5-10 second delay.
*   **Anti-Fraud:** If the system detects GPS spoofing or impossible travel speeds (e.g., checking in at Marigot and then Philipsburg in 2 minutes), the points may be held for review.

---

## 4. Itineraries & Sharing

### How do I add locations to an itinerary?
You cannot add locations directly from the Itinerary screen. 
1.  Go to the **Map Tab**.
2.  Tap a location pin or find it in the list below the map.
3.  Tap **"+ Add"** or **"Add to Itinerary"** in the details popup.
4.  Select your target itinerary.

### Why isn't my shared itinerary link working?
Itinerary sharing uses **Deep Linking** (`sxmgo://itinerary/...`). 
*   The recipient must have the SXM GO app installed to view the full details.
*   The itinerary must be set to **"Public"** in the itinerary settings for others to view it.

---

## 5. Profile & Privacy

### Why won't my profile photo upload?
Avatar uploads require **Photo Library/Media permissions**. 
*   **File Size:** Images larger than 5MB may be rejected by the server.
*   **Format:** We support `.jpg`, `.png`, and `.webp`.
**Solution:** Try a smaller photo or a different format. If the "Picker" doesn't open, reset permissions in Settings > SXM GO > Photos.

### How do I delete my account and data?
In compliance with **GDPR and CCPA**, we provide a self-service deletion option:
1.  Go to **Profile** > **Privacy & Data**.
2.  Select **"Delete Account"**.
3.  Confirm the prompt. Note: This action is permanent and deletes all points, history, and group memberships.

---

## 6. Troubleshooting Checklist

Before reporting a bug, please perform the following:
1.  **Toggle AirPlane Mode:** Resets your cellular and GPS radios.
2.  **Check for Updates:** Ensure you are on the latest version from the App Store or Play Store.
3.  **Clear Cache:** (Android only) Go to App Info > Storage > Clear Cache.
4.  **Verify Permissions:** Map, Camera, and Notifications should all be enabled for the best experience.