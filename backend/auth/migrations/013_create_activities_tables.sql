-- Migration 013: Activity Tracking (Strava-style)
-- FR-084 to FR-096: Route tracking and statistics

CREATE TABLE public.activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT,
  start_time      TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time        TIMESTAMPTZ,
  distance        DOUBLE PRECISION DEFAULT 0, -- in kilometers
  duration        INTEGER DEFAULT 0, -- in seconds
  avg_pace        DOUBLE PRECISION DEFAULT 0, -- min/km
  polyline        TEXT, -- Encoded polyline or geojson
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link check-ins to specific activities
ALTER TABLE public.check_ins ADD COLUMN activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL;

-- Indexing
CREATE INDEX idx_activities_user_id ON public.activities(user_id);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
