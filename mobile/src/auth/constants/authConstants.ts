// Auth-related constants and user-facing messages

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  EMAIL_IN_USE: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password does not meet the requirements.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  ACCOUNT_DELETED: 'This account has been deleted.',
  OAUTH_CANCELLED: 'Sign-in was cancelled.',
  OAUTH_FAILED: 'Social sign-in failed. Please try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

export const AUTH_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created! Please check your email to verify.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
  PASSWORD_CHANGED: 'Password updated successfully.',
  PROFILE_UPDATED: 'Profile updated.',
  DELETION_REQUESTED: 'Account deletion scheduled. You can cancel within 30 days.',
  DELETION_CANCELLED: 'Account deletion cancelled.',
  DATA_EXPORT_READY: 'Your data export is ready.',
  CONSENT_UPDATED: 'Privacy preferences saved.',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  DISPLAY_NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 500,
  EMAIL_MAX_LENGTH: 254,
} as const;

export const ONBOARDING_SCREENS = [
  {
    title: 'Welcome to SXM GO',
    description: 'Discover St. Maarten like never before. Explore beaches, restaurants, casinos, and hidden gems across the island.',
  },
  {
    title: 'Earn Points & Badges',
    description: 'Check in at locations to earn points, unlock badges, and compete on the leaderboard with travelers worldwide.',
  },
  {
    title: 'Enable Location',
    description: 'To check in at locations, we need your location permission. Your location is only used when you check in and is never shared.',
  },
] as const;
