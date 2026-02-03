-- Migration 001: Create profiles table
-- Extends Supabase auth.users with application-specific profile data
-- FR-002: Stores name, profile photo, visit history, total points, achievements, preferences

CREATE TABLE public.profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name                TEXT NOT NULL DEFAULT '',
  email                       TEXT NOT NULL,
  avatar_url                  TEXT,
  bio                         TEXT DEFAULT '',
  total_points                INTEGER NOT NULL DEFAULT 0,
  visit_count                 INTEGER NOT NULL DEFAULT 0,

  -- FR-007, FR-008: Location permission state
  location_tracking_enabled   BOOLEAN NOT NULL DEFAULT FALSE,

  -- FR-009: GDPR/CCPA fields
  gdpr_consent_at             TIMESTAMPTZ,
  ccpa_opt_out                BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_opt_in            BOOLEAN NOT NULL DEFAULT FALSE,

  -- FR-011: Data residency metadata
  data_region                 TEXT NOT NULL DEFAULT 'us-east-1',

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for leaderboard queries by points (Dev 4 will use)
CREATE INDEX idx_profiles_total_points ON public.profiles(total_points DESC);

-- Index for user search by display name (FR-097)
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- Auto-update updated_at timestamp on row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
