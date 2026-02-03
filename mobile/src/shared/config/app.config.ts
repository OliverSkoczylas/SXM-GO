// App-wide configuration constants

export const APP_CONFIG = {
  // App identity
  appName: 'SXM GO',
  bundleId: 'com.sxmgo.app',

  // Check-in radius in meters (FR-027: configurable 50-100m)
  defaultCheckInRadiusMeters: 75,
  minCheckInRadiusMeters: 50,
  maxCheckInRadiusMeters: 100,

  // Session
  sessionTimeoutMs: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Pagination
  leaderboardPageSize: 100,
  activityPageSize: 20,

  // Supported languages (FR-111)
  supportedLanguages: ['en', 'nl', 'es', 'fr'] as const,
  defaultLanguage: 'en' as const,

  // Deletion grace period in days (FR-006)
  deletionGracePeriodDays: 30,

  // Avatar
  maxAvatarSizeBytes: 5 * 1024 * 1024, // 5MB
  avatarBucket: 'avatars',
} as const;
