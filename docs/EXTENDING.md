# Extending the Application
Author: Taylor Knipe

## Overview

This document explains where to find the main project resources and how to make changes after the app has already been installed and configured.

SXM GO is a React Native mobile application with supporting backend resources. The current project structure suggests that most app changes will happen in the `mobile/src/` area, while backend-related changes will happen in the `backend/` area.

---

## Where to Find Dependencies

Project dependencies are listed in:

* `package.json`
* `package-lock.json`

These files define the JavaScript/TypeScript packages used by the app, including React Native, navigation libraries, Supabase, OAuth libraries, testing libraries, and development tools.

If you add or remove packages, update them through npm so the dependency files stay in sync.

---

## Where to Make Changes in the App

The app appears to be organized around the `mobile/src/auth/` area, which currently contains not only authentication logic but also several other feature screens and services.

### Main places to edit

#### Navigation

Use these files to understand and modify how users move through the app:

* `mobile/src/auth/navigation/RootNavigator.tsx`
* `mobile/src/auth/navigation/AuthNavigator.tsx`
* `mobile/src/auth/navigation/AppNavigator.tsx`

If you are adding a new screen or changing how users reach an existing screen, start here.

#### Screens

Use the `screens/` folder to modify page-level UI and feature behavior. Based on the current structure, this includes files such as:

* `LoginScreen.tsx`
* `SignUpScreen.tsx`
* `ProfileScreen.tsx`
* `MapScreen.tsx`
* `ChallengesScreen.tsx`
* `LeaderboardScreen.tsx`
* `ItineraryListScreen.tsx`
* `ItineraryDetailScreen.tsx`
* `CreateItineraryScreen.tsx`
* `SettingsScreen.tsx`
* `PrivacySettingsScreen.tsx`

If a user-facing feature needs visual or workflow changes, the screen file is usually the first place to check.

#### Components

Reusable UI pieces are stored in `components/`. Edit these when the same behavior or design is used in multiple places.

Examples include:

* `LoginForm.tsx`
* `SocialLoginButtons.tsx`
* `AvatarPicker.tsx`
* `ConsentCheckbox.tsx`
* `LocationPermissionModal.tsx`
* `AddToItineraryModal.tsx`

#### Hooks

Custom hooks are stored in `hooks/`. These are good places to update shared state logic or reusable feature behavior.

Examples include:

* `useProfile.ts`
* `usePreferences.ts`
* `useItineraries.ts`
* `useLocationPermission.ts`

#### Services

Business logic, backend calls, auth logic, and data-related operations are stored in `services/`.

Examples include:

* `authService.ts`
* `profileService.ts`
* `privacyService.ts`
* `itineraryService.ts`
* `leaderboardService.ts`
* `challengeService.ts`
* `locationService.ts`
* `avatarService.ts`
* `preferencesService.ts`
* `oauthConfig.ts`
* `secureStorage.ts`

If you are changing how data is fetched, saved, validated, or sent to external services, start in the relevant service file.

#### Validation and utility logic

Input and validation behavior is handled in utility files such as:

* `validation.ts`
* `inputSanitizer.ts`

These should be updated when rules for forms, safety checks, or input formatting change.

---

## General Workflow for Making Changes

1. Find the screen or feature you want to change.
2. Check the related navigator file to see how the screen is reached.
3. Check the screen file for UI-level behavior.
4. Check the related component, hook, or service file for the underlying logic.
5. Update any validation or sanitization rules if the feature changes user input requirements.
6. Run the relevant tests after making changes.

A good rule is:

* navigation files control access flow
* screen files control page behavior
* component files control reusable UI
* hook files control reusable state/logic
* service files control backend and business logic

---

## Where to Find the Backlog and Bug Lists

The project planning materials refer to a project website or tracking platform for work management.

Use the project website for:

* backlog items
* sprint tasks
* bug tracking
* issue status
* feature progress

If your team uses GitHub Issues, Jira, Linear, Notion, or another tracking tool alongside the project website, that location should also be referenced in the main project README.

---

## How to Add a New Feature

In most cases, adding a new feature will involve several parts of the codebase:

1. Add or update a screen in the appropriate `screens/` folder.
2. Add reusable UI in `components/` if needed.
3. Add or update logic in `hooks/` or `services/`.
4. Register the screen in the correct navigator.
5. Add validation rules if the feature accepts user input.
6. Add or update tests for the new behavior.

For small features, you may only need a component and a service update. For larger features, you will usually touch navigation, screens, services, and tests.

---

## Where to Find Tests

Tests are currently organized in:

* `tests/shared`
* `tests/auth`
* `tests/auth/components`

Use these tests as examples when adding new test coverage for:

* service logic
* validation logic
* secure storage behavior
* privacy or auth flows
* UI component rendering and user interaction

---

## Before Submitting Changes

Before submitting code changes:

* make sure the feature works in the app
* run the relevant tests
* check for broken navigation paths
* verify any changed service calls still match backend expectations
* confirm any new dependency is added to `package.json`
* update documentation if the feature changes how users or developers use the app

---

## Current Limitation

The current project structure places many different features under the `auth` area, so locating code may not always be intuitive. When in doubt, start with the navigator files, then trace into screens, hooks, and services.
