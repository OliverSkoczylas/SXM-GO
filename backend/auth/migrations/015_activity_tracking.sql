-- Migration 015: Activity tracking (GPS route recording, Strava-style)
-- Stores user-recorded outdoor activities with route data and check-in associations.

-- ── 1. Activities table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activities (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Timing
  started_at           TIMESTAMPTZ NOT NULL,
  ended_at             TIMESTAMPTZ,                          -- NULL while activity is in progress

  -- Metrics (populated when activity is completed)
  distance_km          FLOAT       NOT NULL DEFAULT 0,
  duration_seconds     INT         NOT NULL DEFAULT 0,
  avg_pace_min_per_km  FLOAT       NOT NULL DEFAULT 0,

  -- Route data: array of { lat, lng, timestamp } objects
  route_points         JSONB       NOT NULL DEFAULT '[]',

  -- Check-ins recorded during this activity
  check_in_ids         UUID[]      NOT NULL DEFAULT '{}',

  -- User-provided metadata
  title                TEXT,
  is_complete          BOOLEAN     NOT NULL DEFAULT false,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activities
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert activities for themselves
CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own activities (e.g. completing a recording)
CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 3. Indexes ─────────────────────────────────────────────────────────────────

-- Fast lookup of all activities for a specific user
CREATE INDEX IF NOT EXISTS idx_activities_user_id
  ON public.activities(user_id);

-- Ordered history (most recent first) for a user's activity feed
CREATE INDEX IF NOT EXISTS idx_activities_started_at_desc
  ON public.activities(started_at DESC);
