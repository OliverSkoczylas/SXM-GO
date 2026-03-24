-- Migration 012: Challenges and Badges
-- FR-059 to FR-071: Challenge mechanics and badges

CREATE TYPE public.challenge_category AS ENUM (
  'Restaurant', 'Beach', 'Casino', 'Shopping', 'Attraction', 'Entertainment', 'Activity', 'Other'
);

CREATE TYPE public.challenge_tier AS ENUM (
  'Bronze', 'Silver', 'Gold'
);

CREATE TABLE public.challenges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          public.challenge_category NOT NULL,
  points_reward     INTEGER NOT NULL DEFAULT 100,
  requirement_count INTEGER NOT NULL DEFAULT 1,
  tier              public.challenge_tier NOT NULL DEFAULT 'Bronze',
  icon_name         TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_challenges (
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id      UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_count     INTEGER NOT NULL DEFAULT 0,
  is_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at      TIMESTAMPTZ,
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);

-- RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges are viewable by authenticated users"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own challenge progress"
  ON public.user_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to award points on challenge completion
CREATE OR REPLACE FUNCTION public.handle_challenge_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
BEGIN
  IF NEW.is_completed AND NOT OLD.is_completed THEN
    -- Get points reward from challenges table
    SELECT points_reward INTO points_to_award FROM public.challenges WHERE id = NEW.challenge_id;
    
    -- Update user profile
    UPDATE public.profiles
    SET total_points = total_points + points_to_award
    WHERE id = NEW.user_id;

    -- Log transaction
    INSERT INTO public.point_transactions (user_id, points, type, metadata)
    VALUES (NEW.user_id, points_to_award, 'challenge_completion', jsonb_build_object('challenge_id', NEW.challenge_id));
    
    NEW.completed_at = now();
  END IF;
  
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_completion
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_completion();

-- Function to update challenge progress on check-in
CREATE OR REPLACE FUNCTION public.update_challenges_on_check_in()
RETURNS TRIGGER AS $$
DECLARE
  loc_category public.location_category;
  ch_record RECORD;
BEGIN
  -- Get category of the location
  SELECT category INTO loc_category FROM public.locations WHERE id = NEW.location_id;

  -- Find all active challenges for this category
  FOR ch_record IN 
    SELECT id, requirement_count 
    FROM public.challenges 
    WHERE category::text = loc_category::text AND is_active = TRUE
  LOOP
    -- Insert or update user progress
    INSERT INTO public.user_challenges (user_id, challenge_id, current_count, is_completed)
    VALUES (NEW.user_id, ch_record.id, 1, (1 >= ch_record.requirement_count))
    ON CONFLICT (user_id, challenge_id) DO UPDATE
    SET current_count = user_challenges.current_count + 1,
        is_completed = (user_challenges.current_count + 1 >= ch_record.requirement_count)
    WHERE NOT user_challenges.is_completed;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_challenges_on_check_in
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_challenges_on_check_in();

-- Seed some challenges
INSERT INTO public.challenges (name, description, category, points_reward, requirement_count, tier, icon_name)
VALUES 
  ('Foodie Bronze', 'Visit 3+ restaurants', 'Restaurant', 100, 3, 'Bronze', 'restaurant-outline'),
  ('Foodie Silver', 'Visit 10+ restaurants', 'Restaurant', 250, 10, 'Silver', 'restaurant-outline'),
  ('Sun Chaser Bronze', 'Visit 5+ beaches', 'Beach', 150, 5, 'Bronze', 'sunny-outline'),
  ('High Roller Bronze', 'Visit 3+ casinos', 'Casino', 200, 3, 'Bronze', 'dice-outline');
