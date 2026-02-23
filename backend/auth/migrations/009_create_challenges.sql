-- Migration 009: Challenges + per-user progress (Dev 3)

CREATE TABLE public.challenges (
  id          TEXT PRIMARY KEY,  -- e.g. 'foodie'
  name        TEXT NOT NULL,
  goal_type   TEXT NOT NULL,     -- e.g. 'count_by_category'
  goal_value  INTEGER NOT NULL CHECK (goal_value > 0),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.challenge_progress (
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX idx_challenge_progress_user
  ON public.challenge_progress(user_id);

-- Reuse existing updated_at trigger function created in 001
CREATE TRIGGER on_challenge_progress_updated
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read challenge definitions
CREATE POLICY "Challenges are viewable by authenticated users"
  ON public.challenges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can read their own progress
CREATE POLICY "Users can read own challenge progress"
  ON public.challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

-- No client writes (server-only)
