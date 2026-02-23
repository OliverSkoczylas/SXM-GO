import type { AuthError, Session, User } from '@supabase/supabase-js';

// ── Profile (maps to public.profiles table) ──

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  total_points: number;
  visit_count: number;
  achievements?: string[];
  location_tracking_enabled: boolean;
  gdpr_consent_at: string | null;
  ccpa_opt_out: boolean;
  marketing_opt_in: boolean;
  data_region: string;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<
  Pick<Profile, 'display_name' | 'avatar_url' | 'bio' | 'location_tracking_enabled' | 'marketing_opt_in' | 'ccpa_opt_out'>
>;

// ── User Preferences (maps to public.user_preferences table) ──

export type Language = 'en' | 'nl' | 'es' | 'fr';
export type DistanceUnit = 'km' | 'mi';
export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  id: string;
  user_id: string;
  notify_challenges: boolean;
  notify_badges: boolean;
  notify_friends: boolean;
  notify_leaderboard: boolean;
  notify_marketing: boolean;
  language: Language;
  distance_unit: DistanceUnit;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

export type UserPreferencesUpdate = Partial<
  Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// ── Privacy / GDPR ──

export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'location_tracking'
  | 'marketing_emails'
  | 'data_processing'
  | 'analytics';

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  consent_version: string;
  created_at: string;
}

export type ConsentState = Partial<Record<ConsentType, boolean>>;

// ── Account Deletion ──

export type DeletionStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: DeletionStatus;
  requested_at: string;
  scheduled_for: string;
  completed_at: string | null;
}

// ── Auth State ──

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  preferences: UserPreferences | null;
}

// ── Auth Result (returned by auth operations) ──

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}
