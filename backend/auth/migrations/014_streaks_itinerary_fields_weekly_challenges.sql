-- Migration 014: Streaks, itinerary enhancements, weekly challenges
-- FR-037: First-time visitor bonus
-- FR-039: Daily check-in streak bonuses
-- FR-038: Itinerary completion multiplier
-- FR-045: Itinerary estimated time & difficulty
-- FR-048: Itinerary total distance
-- FR-070: Weekly challenges with reset

-- ── 1. Streak tracking on profiles ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_check_in_date DATE;

-- ── 2. Itinerary enhancements ──────────────────────────────────────────────
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'easy'
    CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS total_distance_km DOUBLE PRECISION;

-- ── 3. Weekly challenges table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('check_ins', 'category', 'points', 'locations')),
  requirement_value INTEGER NOT NULL,
  requirement_category TEXT, -- NULL for non-category challenges
  point_reward INTEGER NOT NULL DEFAULT 100,
  week_start  DATE NOT NULL,
  week_end    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_challenge_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly challenges viewable by authenticated"
  ON public.weekly_challenges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own weekly progress"
  ON public.weekly_challenge_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. Update check-in trigger for streaks + first-visit bonus ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_check_in()
RETURNS TRIGGER AS $$
DECLARE
  v_last_date DATE;
  v_streak    INTEGER;
  v_longest   INTEGER;
  v_visit     INTEGER;
  v_bonus     INTEGER := 0;
BEGIN
  -- Get current streak state
  SELECT last_check_in_date, current_streak, longest_streak, visit_count
  INTO v_last_date, v_streak, v_longest, v_visit
  FROM public.profiles WHERE id = NEW.user_id;

  -- FR-037: First-time visitor bonus (+20 points)
  IF v_visit = 0 THEN
    v_bonus := v_bonus + 20;
  END IF;

  -- FR-039: Daily streak calculation
  IF v_last_date = CURRENT_DATE THEN
    -- Same day, no streak change
    NULL;
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day, increment streak
    v_streak := v_streak + 1;
    -- Streak bonus: 5 pts per streak day, max 50
    v_bonus := v_bonus + LEAST(v_streak * 5, 50);
  ELSE
    -- Streak broken, reset to 1
    v_streak := 1;
  END IF;

  IF v_streak > v_longest THEN
    v_longest := v_streak;
  END IF;

  -- Update profiles
  UPDATE public.profiles
  SET total_points = total_points + NEW.points_earned + v_bonus,
      visit_count = visit_count + 1,
      current_streak = v_streak,
      longest_streak = v_longest,
      last_check_in_date = CURRENT_DATE
  WHERE id = NEW.user_id;

  -- Base check-in transaction
  INSERT INTO public.point_transactions (user_id, points, type, metadata)
  VALUES (NEW.user_id, NEW.points_earned, 'check-in',
    jsonb_build_object('location_id', NEW.location_id));

  -- Bonus transaction (if any)
  IF v_bonus > 0 THEN
    INSERT INTO public.point_transactions (user_id, points, type, metadata)
    VALUES (NEW.user_id, v_bonus, 'bonus',
      jsonb_build_object(
        'reason',
        CASE
          WHEN v_visit = 0 THEN 'first_visit'
          ELSE 'streak_' || v_streak
        END,
        'location_id', NEW.location_id
      ));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Seed initial weekly challenges ──────────────────────────────────────
INSERT INTO public.weekly_challenges (name, description, requirement_type, requirement_value, requirement_category, point_reward, week_start, week_end) VALUES
('Beach Bum',        'Check in at 3 beaches this week',        'category', 3, 'Beach',      150, date_trunc('week', CURRENT_DATE)::DATE, (date_trunc('week', CURRENT_DATE) + interval '6 days')::DATE),
('Taste Explorer',   'Visit 5 restaurants this week',          'category', 5, 'Restaurant',  200, date_trunc('week', CURRENT_DATE)::DATE, (date_trunc('week', CURRENT_DATE) + interval '6 days')::DATE),
('Island Hopper',    'Check in at 10 locations this week',     'check_ins', 10, NULL,         300, date_trunc('week', CURRENT_DATE)::DATE, (date_trunc('week', CURRENT_DATE) + interval '6 days')::DATE),
('Point Collector',  'Earn 500 points this week',              'points',   500, NULL,          250, date_trunc('week', CURRENT_DATE)::DATE, (date_trunc('week', CURRENT_DATE) + interval '6 days')::DATE)
ON CONFLICT DO NOTHING;

-- ── 6. Itinerary completion bonus function ─────────────────────────────────
-- FR-038: Award 1.5x multiplier when itinerary is completed
CREATE OR REPLACE FUNCTION public.award_itinerary_completion(
  p_itinerary_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_total_points INTEGER;
  v_bonus INTEGER;
BEGIN
  -- Get itinerary owner
  SELECT user_id INTO v_user_id FROM public.itineraries WHERE id = p_itinerary_id;

  -- Sum points of all locations in itinerary
  SELECT COALESCE(SUM(l.points), 0) INTO v_total_points
  FROM public.itinerary_items ii
  JOIN public.locations l ON l.id = ii.location_id
  WHERE ii.itinerary_id = p_itinerary_id;

  -- 50% bonus (the 1.5x multiplier on top of already-earned base)
  v_bonus := ROUND(v_total_points * 0.5);

  -- Award bonus
  UPDATE public.profiles SET total_points = total_points + v_bonus WHERE id = v_user_id;

  INSERT INTO public.point_transactions (user_id, points, type, metadata)
  VALUES (v_user_id, v_bonus, 'bonus',
    jsonb_build_object('reason', 'itinerary_completion', 'itinerary_id', p_itinerary_id));

  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
