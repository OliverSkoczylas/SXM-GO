-- Migration 010: Badges + per-user earned badges (Dev 3)

CREATE TABLE public.badges (
  id         TEXT PRIMARY KEY,  -- e.g. 'points_bronze'
  name       TEXT NOT NULL,
  tier       TEXT NOT NULL,      -- 'bronze' | 'silver' | 'gold'
  rule_type  TEXT NOT NULL,      -- e.g. 'points_threshold'
  threshold  INTEGER NOT NULL CHECK (threshold >= 0),
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_badges (
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id  TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user
  ON public.user_badges(user_id, earned_at DESC);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read badge definitions
CREATE POLICY "Badges are viewable by authenticated users"
  ON public.badges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can read their own earned badges
CREATE POLICY "Users can read own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- No client writes (server-only)
