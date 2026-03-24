# auth/components tests overview

This folder contains unit tests for UI components under `mobile/src/auth/components`.

Each test file follows the existing repository style:
- `describe` / `it` test group structure
- mocked dependencies isolated at file top
- simple smoke checks and behavior assertions

## File summaries

- `AddToItineraryModal.test.ts`
  - Verifies modal renders with a list item.
  - Verifies cancel button calls `onClose`.
  - Uses mocked `useItineraries` Hook to provide data.

- `AvatarPicker.test.ts`
  - Verifies placeholder state when no avatar URL is set.
  - Verifies `Remove` button calls `onRemove` when avatar exists.
  - Mocks `react-native-image-picker` and permission service.

- `ConsentCheckbox.test.ts`
  - Verifies label render.
  - Verifies `onToggle` is called on press.

- `LocationPermissionModal.test.ts`
  - Verifies modal title and description render.
  - Verifies `onAllow` and `onDeny` callbacks fire.

- `LoginForm.test.ts`
  - Verifies invalid login inputs do not trigger `onSubmit`.
  - Verifies validation message for bad email.

- `SignUpForm.test.ts`
  - Verifies invalid sign-up values do not trigger `onSubmit`.
  - Verifies validation message for missing required fields.

- `SocialLoginButtons.test.ts`
  - Verifies "Continue with Google" button exists.
  - Verifies `onGoogle` callback is invoked.

- `SocialIcons.test.ts`
  - Verifies each `GoogleIcon`, `AppleIcon`, `FacebookIcon` renders without throwing.

- `TabIcons.test.ts`
  - Verifies each tab icon renders without throwing with a color prop.

- `OnboardingIcons.test.ts`
  - Verifies each icon (`WelcomeIcon`, `PointsIcon`, `LocationIcon`) renders without a throw.

## How to run

```bash
npm test -- tests/auth/components
```

This README is aimed at developers who want a quick guide to the scope and intent of these tests.
