# Testing Guide

## Overview

SXM GO includes automated tests in the following folders:

- `tests/shared`
- `tests/auth`
- `tests/auth/components`

These tests cover shared permission handling, authentication services, OAuth configuration, profile and privacy services, secure storage, input sanitization, validation, security behavior, and several UI components.

---

## How to Run the Test Suite

Run the full test suite:

npm test

Run only shared tests:

npm test -- tests/shared

Run only auth tests:

npm test -- tests/auth

Run only auth component tests:

npm test -- tests/auth/components

Run a single test file:

npm test -- permissionService.test.ts
npm test -- authService.test.ts
npm test -- oauthConfig.test.ts
npm test -- privacyService.test.ts
npm test -- profileService.test.ts
npm test -- secureStorage.test.ts
npm test -- inputSanitizer.test.ts
npm test -- validation.test.ts
npm test -- security.test.ts
npm test -- AddToItineraryModal.test.ts
npm test -- AvatarPicker.test.ts
npm test -- ConsentCheckbox.test.ts
npm test -- LocationPermissionModal.test.ts
npm test -- LoginForm.test.ts
npm test -- OnboardingIcons.test.ts
npm test -- SignUpForm.test.ts
npm test -- SocialIcons.test.ts
npm test -- SocialLoginButtons.test.ts
npm test -- TabIcons.test.ts

## Test Locations and Brief Description

### tests/shared

tests/shared/permissionService.test.ts

Tests permission handling for location, camera, and photo library access, including granted, denied, blocked, and limited states.

### tests/auth

tests/auth/authService.test.ts

Tests email signup, email login, sign out, session restoration, password reset, and password update behavior.

tests/auth/inputSanitizer.test.ts

Tests sanitizing text input and profile update payloads to escape unsafe characters and preserve safe values.

tests/auth/oauthConfig.test.ts

Tests OAuth provider initialization and verifies Google Sign-In configuration only runs once.

tests/auth/privacyService.test.ts

Tests consent logging, consent state retrieval, account deletion requests, account deletion cancellation, and user data export.

tests/auth/profileService.test.ts

Tests fetching a profile, updating a profile, and updating the location tracking flag.

tests/auth/secureStorage.test.ts

Tests secure local storage for setting, getting, removing, and clearing stored auth-related values.

tests/auth/security.test.ts

Tests auth/session security, OAuth failure handling, input sanitization, schema rejection of malicious input, and privacy-control behavior.

tests/auth/validation.test.ts

Tests validation schemas for email, password, display name, signup, sign-in, and password-change inputs.

tests/auth/components
tests/auth/components/AddToItineraryModal.test.ts

Tests rendering itinerary items in the modal and closing the modal with the Cancel action.

tests/auth/components/AvatarPicker.test.ts

Tests avatar placeholder rendering and the remove-avatar action.

tests/auth/components/ConsentCheckbox.test.ts

Tests rendering the consent label and calling the toggle handler when pressed.

tests/auth/components/LocationPermissionModal.test.ts

Tests rendering the location permission modal and calling the allow and deny callbacks.

tests/auth/components/LoginForm.test.ts

Tests invalid login submission and verifies validation errors appear instead of submitting.

tests/auth/components/OnboardingIcons.test.ts

Tests that onboarding icons render without crashing.

tests/auth/components/SignUpForm.test.ts

Tests invalid sign-up submission and verifies required-field validation appears.

tests/auth/components/SocialIcons.test.ts

Tests that Google, Apple, and Facebook icons render without crashing.

tests/auth/components/SocialLoginButtons.test.ts

Tests rendering the Google login button and calling the Google login callback.

tests/auth/components/TabIcons.test.ts

Tests that tab icons for map, leaderboard, challenges, and profile render without crashing.

## Current Scope of the Test Suite

The current automated tests are focused on:

Shared permission service logic
Auth and account-related service logic
Privacy, profile, and secure storage services
Validation and sanitization utilities
Security-related auth and privacy behavior
UI component rendering and basic user interactions

The current suite does not document end-to-end mobile flows or backend integration tests beyond mocked service behavior.