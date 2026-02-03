-- Migration 007: Row Level Security policies for all auth-related tables
-- TR-022, TR-024: Security enforcement at the database level

-- ============================================================
-- PROFILES TABLE
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read profiles (needed for leaderboards, friend search)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT handled by the signup trigger (SECURITY DEFINER), not by client
-- DELETE handled by CASCADE from auth.users, not by client

-- ============================================================
-- USER_PREFERENCES TABLE
-- ============================================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PRIVACY_CONSENT_LOG TABLE
-- ============================================================
ALTER TABLE public.privacy_consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consent log"
  ON public.privacy_consent_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent"
  ON public.privacy_consent_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Consent records are immutable: no UPDATE or DELETE policies

-- ============================================================
-- DATA_DELETION_REQUESTS TABLE
-- ============================================================
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deletion requests"
  ON public.data_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request own deletion"
  ON public.data_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only cancel their own pending requests
CREATE POLICY "Users can cancel own pending deletion"
  ON public.data_deletion_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');
