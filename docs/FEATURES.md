# SXM GO Features Guide
Author: Taylor Knipe

## Overview

SXM GO is a mobile app built around location-based exploration, check-ins, points, challenges, and rankings. The app is designed to let users explore locations, check in at places they visit, earn points, unlock badges or challenges, and compare their progress on a leaderboard.

At a high level, the user flow is:

1. Create an account or sign in
2. Set up or view a profile
3. Open the map and explore locations
4. Check in at eligible locations
5. Earn points and make progress toward challenges
6. View points, rank, and leaderboard position
7. Use itinerary-related features where available

---

## Main Feature Areas

### 1. Authentication and Account Access

**What this feature does**
- Lets users create an account and sign in
- Maintains the user session after login
- Stores and manages profile information
- Supports social login providers

**Where to find it**
- Main auth flow is handled through:
  - `auth/navigation/RootNavigator.tsx`
  - `auth/navigation/AuthNavigator.tsx`
  - `auth/navigation/AppNavigator.tsx`
- Login and signup screens:
  - `auth/screens/LoginScreen.tsx`
  - `auth/screens/SignUpScreen.tsx`
  - `auth/components/LoginForm.tsx`
- Social login support:
  - `auth/components/SocialLoginButtons.tsx`
  - `auth/components/SocialIcons.tsx`
  - `auth/services/oauthConfig.ts`
- Auth state/session handling:
  - `auth/context/AuthContext.tsx`
  - `auth/context/AuthProvider.tsx`
  - `auth/services/authService.ts`

**How it connects to other features**
- Users must be authenticated before using personalized features like profile data, itineraries, challenges, and leaderboard information
- Authentication provides the user identity needed by the rest of the app

---

### 2. Onboarding

**What this feature does**
- Introduces new users to the app
- Helps guide users through initial setup or first-time use
- Likely connects users into the authenticated app flow

**Where to find it**
- Onboarding screen and visuals:
  - `auth/screens/OnboardingScreen.tsx`
  - `auth/components/OnboardingIcons.tsx`

**How it connects to other features**
- Usually appears before or around account creation/login
- Helps transition the user into the main app experience

---

### 3. User Profile

**What this feature does**
- Allows users to view and update profile information
- Connects the user’s account to app progress
- Likely displays user-related information such as rank, preferences, or account details

**Where to find it**
- Profile screen:
  - `auth/screens/ProfileScreen.tsx`
- Profile hooks/services:
  - `auth/hooks/useProfile.ts`
  - `auth/services/profileService.ts`
- Avatar/profile image support:
  - `auth/components/AvatarPicker.tsx`
  - `auth/services/avatarService.ts`

**How it connects to other features**
- Pulls from authentication for account identity
- May display leaderboard rank, challenge progress, or preferences depending on implementation

---

### 4. Settings, Privacy, and Preferences

**What this feature does**
- Lets users manage app settings and privacy-related options
- Supports user consent and personal preferences
- Includes password management and privacy settings

**Where to find it**
- Main settings screens:
  - `auth/screens/SettingsScreen.tsx`
  - `auth/screens/PrivacySettingsScreen.tsx`
  - `auth/screens/ChangePasswordScreen.tsx`
  - `auth/screens/ForgotPasswordScreen.tsx`
- Related components/hooks/services:
  - `auth/components/ConsentCheckbox.tsx`
  - `auth/hooks/usePreferences.ts`
  - `auth/services/preferencesService.ts`
  - `auth/services/privacyService.ts`

**How it connects to other features**
- Lets users control how the app handles account data and privacy
- Supports the broader account/profile experience

---

### 5. Interactive Map and Location Features

**What this feature does**
- Displays an interactive map for users to explore
- Shows supported locations
- Uses device location features to support map-based functionality

**Where to find it**
- Main map screen:
  - `auth/screens/MapScreen.tsx`
- Location permission handling:
  - `auth/components/LocationPermissionModal.tsx`
  - `auth/hooks/useLocationPermission.ts`
- Location logic/services:
  - `auth/services/locationService.ts`

**How it connects to other features**
- The map is the starting point for location-based activity
- It likely supports check-ins, itineraries, and challenge progression

---

### 6. GPS Check-In

**What this feature does**
- Verifies that a user has visited or is currently near a supported location
- Records the visit as an app activity
- Triggers points, challenge progress, and leaderboard updates

**Where to find it**
- There is not a dedicated `CheckInScreen.tsx` visible in the current structure
- Most likely places to look are:
  - `auth/screens/MapScreen.tsx`
  - `auth/services/locationService.ts`
  - possibly challenge or leaderboard related services if check-ins trigger updates
- This feature may be built directly into the map/location flow rather than its own screen

**How it connects to other features**
- Check-ins feed directly into the points system
- Check-ins can advance challenge progress
- Check-ins affect rankings and leaderboard position

---

### 7. Points System

**What this feature does**
- Awards points based on user activity
- Tracks total progress over time
- Supports competition and motivation across the app

**Where to find it**
- Points are surfaced through:
  - `auth/screens/ProfileScreen.tsx`
  - `auth/screens/ChallengesScreen.tsx`
  - `auth/screens/LeaderboardScreen.tsx`
- Related logic:
  - `auth/services/challengeService.ts`
  - `auth/services/leaderboardService.ts`

**How it connects to other features**
- Receives activity data from check-ins and other actions
- Feeds totals into leaderboard ranking
- Supports challenge and badge progression

---

### 8. Challenges and Badges

**What this feature does**
- Gives users themed goals to complete
- Tracks progress toward milestones
- Rewards exploration and repeated engagement

**Where to find it**
- Challenge screen:
  - `auth/screens/ChallengesScreen.tsx`
- Related challenge logic:
  - `auth/services/challengeService.ts`

**How it connects to other features**
- Uses visit and check-in data to evaluate progress
- Works alongside the points system
- May influence leaderboard activity and user engagement

---

### 9. Leaderboard

**What this feature does**
- Shows how users rank compared to others
- Displays top users by score or activity
- Encourages repeat use through competition

**Where to find it**
- Leaderboard screen:
  - `auth/screens/LeaderboardScreen.tsx`
- Leaderboard logic:
  - `auth/services/leaderboardService.ts`

**How it connects to other features**
- Receives score data from the points system
- Updates based on completed check-ins and activity
- Profile pages may also display the user’s rank

---

### 10. Itineraries

**What this feature does**
- Organizes places into a saved or planned visit list
- Helps users plan exploration across multiple locations
- Makes the app more structured and goal-oriented

**Where to find it**
- Itinerary screens:
  - `auth/screens/ItineraryListScreen.tsx`
  - `auth/screens/ItineraryDetailScreen.tsx`
  - `auth/screens/CreateItineraryScreen.tsx`
- Related components/hooks/services:
  - `auth/components/AddItineraryModal.tsx`
  - `auth/hooks/useItineraries.ts`
  - `auth/services/itineraryService.ts`

**How it connects to other features**
- Uses location-related data
- Can support challenge completion by guiding users to relevant places
- Gives users a way to organize their activity in the app