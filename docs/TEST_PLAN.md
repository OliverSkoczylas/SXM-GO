# SXM GO — Test Plan

**Version:** 1.0  
**Date:** 2026-04-20  
**Author:** QA Team  
**Project:** SXM GO — Gamified Tourism App for St. Maarten  
**Platform:** React Native (iOS + Android) + Supabase

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environments](#2-test-environments)
3. [Test Types](#3-test-types)
4. [Test Cases](#4-test-cases)
   - [4.1 Authentication](#41-authentication)
   - [4.2 Map & Locations](#42-map--locations)
   - [4.3 Check-In System](#43-check-in-system)
   - [4.4 Points & Leaderboard](#44-points--leaderboard)
   - [4.5 Challenges & Badges](#45-challenges--badges)
   - [4.6 Itineraries](#46-itineraries)
   - [4.7 Activity Tracking](#47-activity-tracking)
   - [4.8 Social / Friends](#48-social--friends)
   - [4.9 Offline Mode](#49-offline-mode)
   - [4.10 Performance](#410-performance)
   - [4.11 Security](#411-security)
   - [4.12 Accessibility](#412-accessibility)
5. [Manual QA Testing Script](#5-manual-qa-testing-script)
6. [Bug Reporting Template](#6-bug-reporting-template)
7. [Exit Criteria](#7-exit-criteria-ready-for-app-store)

---

## 1. Introduction

### 1.1 Purpose

This test plan defines the strategy, scope, environments, test cases, and exit criteria for validating **SXM GO** prior to submission to the Apple App Store and Google Play Store. The goal is to ensure the application meets all functional, performance, security, and accessibility requirements across supported devices and operating conditions.

### 1.2 Scope

This plan covers all features included in the **MVP + Sprint 3 implementation**:

- Email/password authentication and social OAuth (Google, Apple, Facebook)
- Interactive map with 55+ St. Maarten locations (Leaflet via WebView)
- GPS-based check-in system with anti-fraud detection
- Points system, streaks, and first-visit bonuses
- Leaderboard (global, weekly, monthly, groups)
- Challenges and badge system
- Itinerary creation and completion
- Activity tracking with GPS route recording
- Social/friends system
- Offline mode with queued check-ins
- Push notifications
- Internationalization (EN, NL, ES, FR)

### 1.3 Out of Scope

The following features are planned for future phases and are **not** covered by this test plan:

- Augmented Reality (AR) features
- Business / merchant dashboard
- Analytics dashboard for admins
- In-app purchases / premium tiers

---

## 2. Test Environments

### 2.1 Environment Definitions

| Environment | Description |
|---|---|
| Development | Local device or emulator; Supabase dev project; simulated GPS |
| Staging | Physical device (Android + iOS); Supabase staging project; real GPS in St. Maarten or equivalent coordinates |
| Production | Final release build; Supabase production project; full App Store / Play Store distribution |

### 2.2 Device Matrix

| Device | Platform | OS Version | Priority |
|---|---|---|---|
| Google Pixel 7 | Android | API 33 (Android 13) | High |
| Samsung Galaxy S21 | Android | API 31 (Android 12) | High |
| Low-end Android device | Android | API 26 (Android 8.0) | Medium |
| iPhone 14 Pro | iOS | iOS 17 | High |
| iPhone SE (3rd gen) | iOS | iOS 16 | High |

### 2.3 Network Conditions

| Network | Description |
|---|---|
| WiFi | Standard broadband connection |
| 4G LTE | Mobile network, full speed |
| 3G (throttled) | Simulated via browser DevTools / Network Link Conditioner (~750 kbps down) |
| Offline | Airplane mode enabled; no data connection |

---

## 3. Test Types

### 3.1 Unit Tests (Jest)

Automated tests for isolated business logic, service functions, and utility functions. Target areas:

- Points calculation (base points, streak multipliers, first-visit bonus)
- GPS distance calculation (Haversine formula)
- Anti-fraud detection logic (speed check, teleport detection)
- Cache expiry logic
- Date/streak computation utilities
- i18n string resolution

### 3.2 Integration Tests

Automated tests validating interaction between the app and Supabase backend:

- Auth flows (sign-up, login, OAuth, sign-out, session refresh)
- Supabase RLS enforcement (cross-user data access)
- Check-in API call chain (validate → insert → award points → trigger badge check)
- Friend request state machine (send → pending → accept/decline)
- Offline queue flush on reconnection

### 3.3 End-to-End Tests (Manual)

Critical user journeys executed manually on physical devices per the [Manual QA Testing Script](#5-manual-qa-testing-script). Covers full happy paths and primary edge cases.

### 3.4 Performance Tests

Measured on both high-end and low-end devices. Metrics include:

- Cold start time
- Map initial render time
- FlatList frame rate at 55+ items
- Leaderboard load time
- Check-in round-trip response time

### 3.5 Security Tests

Manual and semi-automated tests targeting:

- Supabase RLS policies (direct API access attempts)
- GPS spoofing (Android mock location)
- Token storage inspection (AsyncStorage plain-text audit)
- Anon key privilege escalation attempts

### 3.6 Accessibility Tests

Manual verification using platform screen readers (TalkBack on Android, VoiceOver on iOS):

- All interactive elements have `accessibilityLabel` props
- Rank and badge announcements are correct
- App is usable at "Extra Large" font size
- WCAG 2.1 AA contrast compliance (4.5:1 minimum ratio)

### 3.7 Usability Tests

Beta testing with real users located in St. Maarten:

- Minimum 5 participants across different age groups
- Unmoderated sessions recorded via screen capture
- Feedback collected on navigation, onboarding clarity, and check-in UX

---

## 4. Test Cases

> **Status Legend:** `PASS` | `FAIL` | `BLOCKED` | `NOT TESTED`

---

### 4.1 Authentication

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-AUTH-001 | Email sign-up with valid credentials | App installed, fresh launch, no existing account | 1. Open app. 2. Tap "Sign Up". 3. Enter a unique valid email and password (8+ chars). 4. Tap "Create Account". | Account created, user directed to onboarding, session established. | |
| TC-AUTH-002 | Email sign-up with duplicate email | An account already exists with the test email | 1. Tap "Sign Up". 2. Enter the existing email and a valid password. 3. Tap "Create Account". | Error message displayed: "An account with this email already exists." No new account created. | |
| TC-AUTH-003 | Email sign-up with weak password (< 8 chars) | App on Sign Up screen | 1. Tap "Sign Up". 2. Enter valid email and a 5-character password. 3. Tap "Create Account". | Inline validation error shown: "Password must be at least 8 characters." Form not submitted. | |
| TC-AUTH-004 | Email login with correct credentials | Existing account with known credentials | 1. Tap "Log In". 2. Enter correct email and password. 3. Tap "Log In". | User authenticated, directed to main Map screen. | |
| TC-AUTH-005 | Email login with wrong password | Existing account | 1. Tap "Log In". 2. Enter correct email but incorrect password. 3. Tap "Log In". | Error message displayed: "Invalid email or password." User remains on login screen. | |
| TC-AUTH-006 | Google OAuth login | Google account available on device | 1. Tap "Continue with Google". 2. Select a Google account in the native picker. | User authenticated via OAuth, directed to Map screen or onboarding if first time. | |
| TC-AUTH-007 | Apple Sign-In (iOS only) | Physical iOS device with Apple ID configured | 1. Tap "Continue with Apple". 2. Authenticate with Face ID / Touch ID. | User authenticated, session created, directed to Map or onboarding. | |
| TC-AUTH-008 | Facebook OAuth login | Facebook app or account available | 1. Tap "Continue with Facebook". 2. Authorise in Facebook OAuth flow. | User authenticated, session created, directed to Map or onboarding. | |
| TC-AUTH-009 | Session persists after app restart | User is logged in | 1. Force-close the app. 2. Reopen the app. | User is still authenticated; app opens directly to Map screen without prompting login. | |
| TC-AUTH-010 | Forgot password flow sends reset email | Existing account, access to that email inbox | 1. Tap "Forgot Password". 2. Enter the registered email. 3. Tap "Send Reset Email". 4. Check inbox. | Confirmation message shown in app. Password reset email received within 2 minutes. | |
| TC-AUTH-011 | Sign out clears session | User is logged in | 1. Navigate to Profile. 2. Tap "Sign Out". 3. Confirm sign out. | Session cleared, user returned to auth/onboarding screen. AsyncStorage session token removed. | |
| TC-AUTH-012 | Onboarding shown only on first launch | Fresh install, no prior session | 1. Open app for the first time after install. 2. Complete sign-up. | Onboarding flow shown. 3. Force-close and reopen app. | Onboarding NOT shown again; app opens to Map directly. | |

---

### 4.2 Map & Locations

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-MAP-001 | Map loads within 2 seconds on WiFi | User is authenticated; device on WiFi | 1. Navigate to the Map screen. 2. Start a timer at screen tap. | Map with Leaflet WebView renders fully (tiles + pins visible) within 2 seconds. | |
| TC-MAP-002 | All 55+ locations display as pins | Map screen loaded | 1. Set filter to "All". 2. Pan and zoom across the entire island. | All 55+ location pins are rendered with no missing markers. | |
| TC-MAP-003 | Category filter shows only correct category | Map loaded with all pins visible | 1. Tap a category filter (e.g., "Beach"). | Only pins matching the selected category are visible. Pins from other categories are hidden. | |
| TC-MAP-004 | "All" filter shows all locations | A category filter is currently active | 1. Tap the "All" filter button. | All 55+ pins reappear regardless of category. | |
| TC-MAP-005 | Visited locations show distinct visual state | User has previously checked in at one or more locations | 1. Open Map with "All" filter. | Visited locations display a visually distinct pin style (e.g., different colour or checkmark icon) compared to unvisited pins. | |
| TC-MAP-006 | Tapping info button navigates to Location Detail | Map loaded with visible pins | 1. Tap the info (ℹ) button on any location pin or callout. | Location Detail screen opens for the selected location. | |
| TC-MAP-007 | Location Detail shows correct information | Location Detail screen open | 1. Review all content on the screen. | Screen displays: location name, category, points value, full description, and check-in button. | |
| TC-MAP-008 | "Get Directions" opens native maps app | Location Detail screen open | 1. Tap "Get Directions". | Device's default maps app (Google Maps or Apple Maps) opens with the location pre-loaded as a destination. | |
| TC-MAP-009 | User location dot updates in real time | Location permission granted; user moving | 1. Open Map. 2. Walk / drive while watching the map. | Blue user-location dot moves in real time to reflect the user's actual GPS position. | |
| TC-MAP-010 | Map functions in offline mode (cached data) | Map has been opened at least once on WiFi; airplane mode enabled | 1. Enable airplane mode. 2. Navigate to Map screen. | Map renders with all previously cached pins. No crash or blank screen. Appropriate offline banner displayed. | |

---

### 4.3 Check-In System

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-CHECKIN-001 | Check-in succeeds when within 150m of location | User authenticated; GPS active; physically or simulated within 150m of a location | 1. Navigate to a location on the map. 2. Tap "Check In". | Check-in accepted. Success toast shown. Points awarded. Location marked as visited. | |
| TC-CHECKIN-002 | Check-in rejected when >150m from location | User authenticated; GPS active; device >150m away from location | 1. Tap "Check In" on a location the user is far from. | Check-in rejected. Error message: "You are too far from this location." No points awarded. | |
| TC-CHECKIN-003 | Check-in awards correct points immediately | User within 150m of a non-visited location | 1. Note current point total on Profile. 2. Check in at the location. 3. Navigate to Profile. | Profile point total increases by the exact points value listed for that location. | |
| TC-CHECKIN-004 | First-visit bonus (+20 pts) awarded once only | User has not previously visited the location | 1. Check in at a new location (first visit). 2. Note points awarded (should include +20 bonus). 3. Check in at the same location again (if allowed). | +20 bonus awarded only on the first visit. Subsequent check-ins at the same location do not award the bonus. | |
| TC-CHECKIN-005 | Second check-in at same location blocked | User has already checked in at a location | 1. Navigate to a previously visited location. 2. Attempt to check in again. | Check-in rejected. Message: "You've already checked in here." Check-in button disabled or shows visited state. | |
| TC-CHECKIN-006 | Streak bonus applied on consecutive days | User checked in at least once yesterday | 1. Check in at a location today. | Streak counter increments by 1. Streak bonus points applied on top of base points. | |
| TC-CHECKIN-007 | Check-in queued when offline | Airplane mode enabled; user within simulated 150m of location | 1. Enable airplane mode. 2. Attempt check-in at a location. | App acknowledges the check-in and adds it to the pending queue. Pending count banner displayed. | |
| TC-CHECKIN-008 | Queued check-in syncs on reconnection | At least one check-in is in the offline queue | 1. Disable airplane mode. 2. Wait up to 30 seconds. | Pending check-in(s) automatically sync to Supabase. Points awarded. Pending queue clears. | |
| TC-CHECKIN-009 | Mock location flagged (Android developer mode) | Android device with Developer Options enabled; mock location app active | 1. Set a mock GPS coordinate within 150m of a location. 2. Attempt check-in. | Check-in flagged or rejected. App detects `isMockLocationEnabled` and shows a warning or refuses the check-in. | |
| TC-CHECKIN-010 | Teleport detection flags check-in | Simulated rapid GPS jump (>500m in <30 seconds) | 1. Simulate GPS position A. 2. Within 30 seconds, change GPS to position B (>500m away). 3. Attempt check-in at position B. | Check-in flagged as suspicious. Points withheld or check-in rejected with anti-fraud message. | |
| TC-CHECKIN-011 | Speed check flags check-in | Simulated GPS movement at >120 km/h | 1. Simulate successive GPS points implying >120 km/h movement. 2. Attempt check-in. | Check-in flagged due to implausible speed. Anti-fraud flag recorded. | |

---

### 4.4 Points & Leaderboard

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-POINTS-001 | Total points update on profile immediately after check-in | User authenticated; valid check-in performed | 1. Check in at a location. 2. Immediately navigate to Profile. | Profile total points reflect the newly awarded points without requiring a manual refresh. | |
| TC-POINTS-002 | Recent activity feed shows new check-in | Check-in just completed | 1. Navigate to Profile > Activity Feed. | The most recent check-in appears at the top of the activity feed with correct location name, timestamp, and points. | |
| TC-POINTS-003 | Global leaderboard loads within 2 seconds | User authenticated; on WiFi | 1. Navigate to Leaderboard > Global tab. 2. Time the load from tap to rendered list. | Leaderboard renders with user entries within 2 seconds. | |
| TC-POINTS-004 | Current user row highlighted on leaderboard | User is authenticated and has points | 1. Open any leaderboard tab. | The current user's row is visually distinguished (e.g., highlighted background or bold text) from other entries. | |
| TC-POINTS-005 | Weekly leaderboard shows only current week data | User authenticated | 1. Navigate to Leaderboard > Weekly tab. | Only check-ins and points earned during the current calendar week (Mon–Sun) are reflected in rankings. | |
| TC-POINTS-006 | Monthly leaderboard shows only current month data | User authenticated | 1. Navigate to Leaderboard > Monthly tab. | Only check-ins and points earned during the current calendar month are reflected in rankings. | |
| TC-POINTS-007 | Group leaderboard shows only group members | User is a member of at least one group | 1. Navigate to Leaderboard > Groups tab. 2. Select the group. | Only members of that specific group are listed. No other users appear. | |
| TC-POINTS-008 | Create group generates unique invite code | User is authenticated | 1. Navigate to Leaderboard > Groups. 2. Tap "Create Group". 3. Enter a group name. 4. Confirm creation. | Group created. A unique alphanumeric invite code is displayed and can be copied/shared. | |
| TC-POINTS-009 | Join group with valid invite code succeeds | A group invite code exists | 1. Navigate to Groups > Join Group. 2. Enter the valid invite code. 3. Tap "Join". | User added to the group. Group appears in the user's Groups list. User visible on group leaderboard. | |
| TC-POINTS-010 | Join group with invalid code shows error | User on Join Group screen | 1. Enter an invalid or expired invite code. 2. Tap "Join". | Error message displayed: "Invalid or expired invite code." User not added to any group. | |

---

### 4.5 Challenges & Badges

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-BADGE-001 | Foodie Bronze badge awarded after 3 restaurant check-ins | User authenticated; fewer than 3 restaurant check-ins recorded | 1. Check in at 3 distinct restaurant locations. | After the 3rd restaurant check-in, "Foodie Bronze" badge is awarded. Badge appears on Challenges and Profile screens. | |
| TC-BADGE-002 | Sun Chaser badge awarded after 5 beach check-ins | User authenticated; fewer than 5 beach check-ins recorded | 1. Check in at 5 distinct beach locations. | After the 5th beach check-in, "Sun Chaser" badge is awarded. Badge displayed on profile. | |
| TC-BADGE-003 | First Check-In badge awarded on first ever check-in | User has no prior check-ins | 1. Perform the user's very first check-in at any location. | "First Check-In" badge immediately awarded and displayed in Challenges screen. | |
| TC-BADGE-004 | Badge progress updates in real time | User has a badge partially in progress | 1. Complete a qualifying check-in. 2. Immediately navigate to Challenges screen. | Badge progress bar or counter updates without requiring manual refresh. | |
| TC-BADGE-005 | Weekly challenge progress increments after qualifying check-in | An active weekly challenge is live | 1. Navigate to Challenges > Weekly. 2. Note current progress count. 3. Complete a qualifying check-in. 4. Return to Challenges. | Weekly challenge progress count has incremented by 1. | |
| TC-BADGE-006 | Weekly challenge completion notification sent | User is one check-in away from completing weekly challenge; push notifications enabled | 1. Complete the final qualifying check-in. | A push notification is received: "You've completed this week's challenge!" Challenge shows as completed. | |
| TC-BADGE-007 | Badge displayed on profile after earning | User has earned at least one badge | 1. Navigate to Profile > Badges section. | All earned badges are displayed with correct names and artwork. Unearned badges shown as locked/greyed. | |

---

### 4.6 Itineraries

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-ITIN-001 | Create itinerary with title and description | User authenticated | 1. Navigate to Itineraries tab. 2. Tap "Create Itinerary". 3. Enter a title and description. 4. Save. | New itinerary appears in the Itineraries list with correct title and description. | |
| TC-ITIN-002 | Add location to itinerary from map | Itinerary created | 1. Open the Map screen. 2. Tap a location pin. 3. Select "Add to Itinerary". 4. Select the target itinerary. | Location added to the itinerary. Location count on itinerary card updates. | |
| TC-ITIN-003 | Itinerary shows calculated distance and estimated time | Itinerary with 2+ locations | 1. Open an itinerary with at least 2 locations. | Estimated total distance (km/miles) and travel time displayed on the itinerary detail screen. | |
| TC-ITIN-004 | Check-in at itinerary location marks it visited | Active itinerary with unvisited locations; user near one of them | 1. Open an itinerary. 2. Check in at one of its locations. 3. Return to itinerary detail. | The checked-in location is marked as visited/completed in the itinerary's location list. Progress indicator updates. | |
| TC-ITIN-005 | Complete itinerary awards 1.5× bonus | User has completed all but the final location in an itinerary | 1. Check in at the last remaining location in the itinerary. | Completion detected. 1.5× point bonus awarded on top of the location's base points. Completion message or badge shown. | |
| TC-ITIN-006 | Duplicate a shared itinerary to own profile | A shared itinerary is accessible | 1. Open a shared itinerary. 2. Tap "Duplicate / Save to My Itineraries". | A copy of the itinerary appears in the user's own Itineraries list. Original not modified. | |
| TC-ITIN-007 | Delete itinerary removes it from list | User has at least one itinerary | 1. Long-press or swipe an itinerary to reveal delete. 2. Confirm deletion. | Itinerary removed from the list. Cannot be recovered. | |
| TC-ITIN-008 | Edit itinerary title and description | User has at least one itinerary | 1. Open an itinerary. 2. Tap "Edit". 3. Modify the title and/or description. 4. Save. | Itinerary list and detail screen reflect the updated title and description. | |

---

### 4.7 Activity Tracking

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-ACT-001 | Start activity creates new activity record in DB | User authenticated; location permission granted | 1. Tap the 🏃 FAB on the Map screen. 2. Tap "Start Activity". | A new activity record is created in Supabase (status: in-progress). Activity timer and route display shown. | |
| TC-ACT-002 | GPS route points recorded every ~10 metres moved | Activity in progress; user moving | 1. Start an activity. 2. Walk at least 100m. | GPS waypoints captured at approximately 10m intervals. Route polyline updates on the in-activity map view. | |
| TC-ACT-003 | Live distance updates as user moves | Activity in progress | 1. Observe the distance counter while walking. | Distance counter increments in real time as the user moves. No stale/frozen values. | |
| TC-ACT-004 | Live duration timer increments every second | Activity in progress | 1. Observe the duration timer on the activity screen. | Timer increments by 1 second every second. No skipping or freezing. | |
| TC-ACT-005 | Stop activity saves complete record | Activity in progress with recorded route | 1. Tap "Stop Activity". 2. Confirm in the prompt. | Activity record updated in Supabase with final distance, duration, route polyline, and end timestamp. | |
| TC-ACT-006 | Completed activity appears in Activity History | Activity just completed | 1. Navigate to Profile > Activity History. | The completed activity appears at the top of the list with correct date, distance, and duration. | |
| TC-ACT-007 | Activity Detail shows route polyline on map | Completed activity with a recorded route | 1. Tap a completed activity in Activity History. | Activity Detail screen loads a map with the recorded GPS route rendered as a polyline. | |
| TC-ACT-008 | Activity Detail shows correct stats | Completed activity | 1. Open Activity Detail for a known activity. | Distance, duration, and pace (min/km or min/mile) values match the values shown at activity end. | |
| TC-ACT-009 | Delete activity removes it from history | Completed activity exists | 1. Open Activity History. 2. Long-press or swipe an activity. 3. Confirm delete. | Activity removed from history list and deleted from Supabase. | |
| TC-ACT-010 | Activity tracking cleans up GPS watch on app background | Activity in progress | 1. Start an activity. 2. Press the home button (send app to background). 3. Confirm in device battery/location settings. | GPS location watch is properly cleaned up or transitioned to background mode; no persistent unnecessary GPS drain reported. | |

---

### 4.8 Social / Friends

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-SOC-001 | Search for user by display name returns results | At least one other user account exists with a known display name | 1. Navigate to Friends > Find People. 2. Type the known display name in the search bar. | Matching user(s) appear in the search results list with avatar and display name. | |
| TC-SOC-002 | Send friend request shows "Pending" state | Target user found in search; no existing friend relationship | 1. Tap "Add Friend" on a search result. | Button state changes to "Pending". Request stored in Supabase. | |
| TC-SOC-003 | Receiving user sees request in Requests tab | A friend request has been sent to the test account | 1. Log in as the receiving user. 2. Navigate to Friends > Requests tab. | The incoming friend request is listed with the sender's name and avatar. | |
| TC-SOC-004 | Accept friend request adds to Friends tab for both users | A pending friend request exists | 1. On receiving user's device, tap "Accept". | Both users now appear in each other's Friends tab. Relationship status updated in Supabase. | |
| TC-SOC-005 | Decline friend request removes it | A pending friend request exists | 1. On receiving user's device, tap "Decline". | Request removed from Requests tab. Sender's button reverts to "Add Friend". No friendship created. | |
| TC-SOC-006 | Cancel sent request reverts to "Add Friend" | User has a pending outgoing request | 1. Navigate to Friends > Sent Requests or find the user in search. 2. Tap "Cancel Request". | Pending request removed. Button reverts to "Add Friend". | |
| TC-SOC-007 | Remove friend removes from both users' lists | Two users are friends | 1. Navigate to Friends tab. 2. Long-press or tap options on a friend. 3. Select "Remove Friend". Confirm. | Friend removed from both users' Friends lists immediately. | |
| TC-SOC-008 | View another user's public profile | Users are friends | 1. Tap a friend's name in the Friends list. | Public profile screen opens showing: display name, avatar, total points, check-in count, and earned badges. | |
| TC-SOC-009 | Cannot send friend request to yourself | User is authenticated | 1. Search for own display name. 2. Attempt to tap "Add Friend" on own result. | "Add Friend" button is disabled or not shown for the logged-in user's own profile. No self-request created. | |

---

### 4.9 Offline Mode

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-OFF-001 | Locations load from cache when offline | Map opened at least once on WiFi; airplane mode now enabled | 1. Enable airplane mode. 2. Navigate to Map screen. | All previously cached location pins load and display correctly. No spinner or error state replacing the map. | |
| TC-OFF-002 | Check-in queued offline shown in pending banner | Airplane mode enabled; user within simulated 150m of a location | 1. Attempt a check-in while offline. | Check-in added to local queue. A pending check-ins banner/badge increments to reflect the queued item. | |
| TC-OFF-003 | Pending check-ins sync automatically on reconnect | At least one offline check-in is queued | 1. Disable airplane mode. 2. Observe the app without manual interaction. | Within 30 seconds, queued check-ins are synced to Supabase. Points awarded. Pending count clears. | |
| TC-OFF-004 | Cache expires after 24 hours and fetches fresh data | Cache is older than 24 hours; device has connectivity | 1. Travel 24+ hours since last fresh load (or manipulate device clock for testing). 2. Open Map screen. | App detects stale cache and fetches fresh location data from Supabase before rendering. | |

---

### 4.10 Performance

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-PERF-001 | App cold start < 3 seconds on WiFi | App fully closed (not in background); device on WiFi | 1. Start a timer. 2. Tap app icon. 3. Stop timer when Map screen is fully rendered. | App reaches a usable Map screen within 3 seconds on both high-end and low-end test devices. | |
| TC-PERF-002 | Map initial load < 2 seconds | User authenticated; on WiFi; Map screen not yet rendered | 1. Time from tapping Map tab to full pin render. | Leaflet WebView with all location pins renders within 2 seconds. | |
| TC-PERF-003 | FlatList with 55 items scrolls at ≥ 60 fps | Location list or leaderboard list visible with 55+ items | 1. Enable performance monitor (Flipper or React Native Perf). 2. Scroll the list rapidly. | No dropped frames. Frame rate stays at or above 60 fps. No VirtualizedList warnings in console. | |
| TC-PERF-004 | Leaderboard loads < 2 seconds | User authenticated; on WiFi | 1. Time from tapping Leaderboard tab to full list render. | Leaderboard list renders within 2 seconds. | |
| TC-PERF-005 | Check-in response time < 1 second on WiFi | User within 150m of location; on WiFi | 1. Tap "Check In". 2. Time from tap to success toast. | Full round-trip (GPS validate → Supabase insert → points update) completes within 1 second. | |
| TC-PERF-006 | No VirtualizedList slow update warnings in logs | Any screen with a scrollable list active | 1. Open console/Metro logs. 2. Scroll through all list screens. | Zero instances of "VirtualizedList: You have a large list that is slow to update" in the log output. | |

---

### 4.11 Security

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-SEC-001 | RLS — user cannot read another user's private data via API | Two user accounts (User A, User B); User A's Supabase auth token known | 1. Using a REST client (e.g., Postman), make a GET request to the profiles/check-ins table using User A's token but filtering for User B's `user_id`. | Request returns empty result or 403. User A cannot access User B's private rows. | |
| TC-SEC-002 | RLS — user cannot modify another user's profile | Two user accounts; User A's token | 1. Using REST client with User A's token, send a PATCH request to update User B's profile row. | Request returns 403 or 0 rows affected. User B's data is not modified. | |
| TC-SEC-003 | Auth token not stored in plain text in AsyncStorage | User is logged in; access to device storage inspection (Flipper or ADB) | 1. Inspect AsyncStorage contents via Flipper's AsyncStorage plugin or `adb shell`. 2. Search for the Supabase JWT token. | JWT is not stored in plain text. Supabase client stores tokens in secure storage or encrypted format. | |
| TC-SEC-004 | Supabase anon key cannot bypass RLS restrictions | Supabase anon key is known (it is public) | 1. Using REST client, make requests using only the anon key (no user JWT) to access user-specific protected tables. | Requests return empty results or 401/403. RLS blocks unauthenticated access to protected data. | |
| TC-SEC-005 | GPS spoofing detection catches Android mock location | Android device with Developer Options; mock location app installed | 1. Install a mock location app. 2. Set fake GPS coordinates within 150m of a location. 3. Attempt check-in in SXM GO. | App detects mock location via Android API. Check-in rejected or flagged with anti-fraud annotation in Supabase. | |

---

### 4.12 Accessibility

| ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-A11Y-001 | All interactive elements have accessibilityLabel | TalkBack (Android) or VoiceOver (iOS) enabled | 1. Navigate through all app screens using only the screen reader. 2. Activate each button, tab, and interactive element. | Every interactive element announces a meaningful label (not just "Button" or element type alone). No unlabeled touch targets. | |
| TC-A11Y-002 | Screen reader announces leaderboard ranks correctly | Screen reader enabled; Leaderboard screen open | 1. Navigate through Leaderboard rows using screen reader swipe gestures. | Screen reader announces each row as e.g., "Rank 3, John D., 450 points." Rank and context are clear. | |
| TC-A11Y-003 | Screen reader announces badge names on Challenges screen | Screen reader enabled; Challenges screen open | 1. Navigate through badge items using screen reader. | Each badge announces its name and progress, e.g., "Foodie Bronze badge, 2 of 3 restaurants visited." | |
| TC-A11Y-004 | App usable with font size set to "Extra Large" | Device font size set to largest available in system accessibility settings | 1. Open app and navigate through all primary screens. | All text remains readable without truncation. No text overlaps UI elements. Layouts adapt correctly to large font. | |
| TC-A11Y-005 | All text meets WCAG 2.1 AA contrast ratio (4.5:1) | Design assets and app open | 1. Use a contrast checking tool (e.g., Colour Contrast Analyser) on all text/background combinations in the app. | All body text achieves a minimum contrast ratio of 4.5:1. Large text (18pt+) achieves minimum 3:1. | |

---

## 5. Manual QA Testing Script

This script is for a QA tester performing a complete end-to-end run on a physical device. Estimated time: 30–45 minutes.

### Setup

- [ ] Fresh install of the SXM GO app on an Android device (staging build)
- [ ] Sign up with a new email account (do not reuse existing test accounts)
- [ ] Complete onboarding flow
- [ ] Ensure GPS/Location permissions are set to "Always Allow"
- [ ] Ensure notifications permission is granted
- [ ] Have a second test device or account available for social testing (steps 13–14)

---

### Core Flow Run

1. **Map loads** — Open app. Confirm the Map screen loads with visible location pins within 2 seconds.

2. **Category filter** — Tap the "Beach" category filter. Confirm only beach-category pins are visible. No other pins should appear.

3. **Location Detail** — Tap the info (ℹ) icon on any visible pin. Confirm the Location Detail screen opens with the location name, category, description, point value, and a "Get Directions" button.

4. **Get Directions** — Tap "Get Directions" on the Location Detail screen. Confirm the device's native maps app (Google Maps or Apple Maps) opens with the selected location as the destination.

5. **Check-In (valid)** — Move to within 150m of a designated test location (coordinate provided separately). Tap "Check In". Confirm: success toast appears, points awarded are shown, and the location pin changes to visited state.

6. **Profile update** — Navigate to the Profile screen. Confirm: total points reflect the newly earned points, and the recent activity feed shows the check-in just performed.

7. **Leaderboard** — Navigate to the Leaderboard screen. Confirm: the Global leaderboard loads with entries, and the current user's row is highlighted.

8. **Challenges update** — Navigate to the Challenges screen. Confirm: badge progress for the category of the location just checked in has updated (e.g., if it was a beach, Sun Chaser progress incremented).

9. **Create itinerary** — Navigate to Itineraries tab. Tap "Create Itinerary". Enter a test title and description. Save. Then go to the Map, tap a location, and add it to the new itinerary. Repeat for a second location. Confirm both locations appear in the itinerary detail.

10. **Itinerary check-in** — Move within range of one of the itinerary locations. Check in at that location. Return to the itinerary. Confirm that location is marked as visited/completed within the itinerary and overall progress has updated.

11. **Activity tracking** — Return to the Map screen. Tap the 🏃 FAB button. Tap "Start Activity". Walk for at least 3–5 minutes covering some distance. Confirm the distance counter and duration timer are updating live. Tap "Stop Activity" and confirm.

12. **Activity History** — Navigate to Profile > Activity History. Confirm the completed activity appears at the top with correct distance and duration. Tap the activity to open Activity Detail. Confirm the GPS route is shown as a polyline on the map and all stats are correct.

13. **Friend request (send)** — Navigate to Friends > Find People. Search for a known test username on the second device. Tap "Add Friend". Confirm the button changes to "Pending".

14. **Friend request (accept)** — On the second test device, navigate to Friends > Requests. Confirm the incoming request is visible. Tap "Accept". Confirm both devices now show the friendship in the Friends tab.

15. **Offline — Map** — Enable Airplane Mode. Navigate to the Map screen. Confirm location pins are still visible from cache. Confirm an appropriate offline indicator is shown.

16. **Offline — Check-In queue** — While still in Airplane Mode, navigate to a test location (simulated coordinates if needed). Attempt a check-in. Confirm the app acknowledges the request and shows a pending queue count.

17. **Reconnect sync** — Disable Airplane Mode. Wait up to 30 seconds. Confirm the pending check-in automatically syncs: the pending count clears, points are awarded on the Profile, and the activity feed updates.

---

### Edge Cases

- [ ] **Distance rejection** — From a location that is clearly more than 500m from any pin, attempt a check-in. Confirm the app rejects it with an appropriate "too far" message.
- [ ] **Mock location (Android)** — Enable Developer Options on the Android device. Install a mock location app (e.g., Fake GPS). Set coordinates within 150m of a test location. Attempt a check-in in SXM GO. Confirm the check-in is rejected or flagged as suspicious.
- [ ] **Auto-login** — While logged in, force-close the app. Reopen it. Confirm the user is taken directly to the Map screen without being asked to log in again.

---

## 6. Bug Reporting Template

When filing a bug, copy the template below and fill in all fields before submitting to the issue tracker.

```
## Bug Report

**Bug ID:** BUG-[AUTO or SEQUENTIAL NUMBER]
**Date:** YYYY-MM-DD
**Tester:** [Full Name]
**Device:** [e.g., Google Pixel 7]
**OS Version:** [e.g., Android 13 / API 33]
**App Version:** [e.g., 1.0.0 (Build 42)]
**Environment:** [ ] Development  [ ] Staging  [ ] Production

---

**Feature Area:**
[e.g., Check-In System / Authentication / Leaderboard / Map]

**Severity:**
[ ] Critical — App crash, data loss, security vulnerability, blocks core functionality
[ ] High — Major feature broken with no workaround
[ ] Medium — Feature partially broken; workaround exists
[ ] Low — Minor UI issue, cosmetic defect, or copy error

**Related Test Case ID (if applicable):** [e.g., TC-CHECKIN-009]

---

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Continue as needed...]

**Expected Result:**
[What should have happened]

**Actual Result:**
[What actually happened]

**Reproducibility:**
[ ] Always  [ ] Intermittent (___% of the time)  [ ] Only once

---

**Logs / Screenshots Attached:** [ ] Yes  [ ] No

**Additional Notes:**
[Any context, hypotheses, or related observations]
```

---

## 7. Exit Criteria: Ready for App Store

The app is considered ready for App Store and Google Play submission when **all** of the following conditions are met:

| Criterion | Target | Notes |
|---|---|---|
| Critical severity test cases | 100% PASS | Zero failures permitted |
| High severity test cases | 100% PASS | Zero failures permitted |
| Medium severity test cases | ≥ 95% PASS | Max 1 open medium bug with documented workaround |
| Open Critical bugs | 0 | No outstanding critical bugs at submission |
| Open High bugs | 0 | No outstanding high bugs at submission |
| Crash rate in staging | < 0.5% | Measured over minimum 200 sessions |
| Performance — cold start | < 3 seconds | Must pass on low-end device (API 26) |
| Performance — map load | < 2 seconds | Must pass on low-end device (API 26) |
| Performance — check-in response | < 1 second | On WiFi connection |
| Accessibility (TC-A11Y-*) | 100% PASS | All 5 accessibility test cases passing |
| Security (TC-SEC-*) | 100% PASS | All 5 security test cases passing |
| Manual QA script | Completed on Android + iOS | Both platforms must pass the full script |
| Beta usability test | Completed with ≥ 5 participants | Feedback reviewed; blocking UX issues resolved |
| i18n spot-check | EN + at least 1 additional language | NL, ES, or FR verified for all primary screens |

---

*End of Test Plan — SXM GO v1.0*
