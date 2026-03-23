-- Migration 009: Create locations and check_ins tables
-- FR-014, FR-018: Location pins and categories
-- FR-027, FR-028: Check-in system

CREATE TYPE public.location_category AS ENUM (
  'Restaurant', 'Beach', 'Casino', 'Shopping', 'Attraction', 'Entertainment'
);

CREATE TABLE public.locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  category    public.location_category NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  points      INTEGER NOT NULL DEFAULT 50,
  address     TEXT,
  hours       TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.check_ins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- FR-031: Prevent duplicate check-ins at same location within 24 hours
  UNIQUE(user_id, location_id)
);

-- RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are viewable by authenticated users"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own check-ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- FR-029, FR-031: Trigger to award points and update profile/leaderboard
CREATE OR REPLACE FUNCTION public.handle_new_check_in()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's total points in profiles
  UPDATE public.profiles
  SET total_points = total_points + NEW.points_earned,
      visit_count = visit_count + 1
  WHERE id = NEW.user_id;

  -- Insert into point_transactions for leaderboards
  INSERT INTO public.point_transactions (user_id, points, type, metadata)
  VALUES (NEW.user_id, NEW.points_earned, 'check-in', jsonb_build_object('location_id', NEW.location_id));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_check_in_created
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_check_in();

-- Seed some initial locations
INSERT INTO public.locations (name, category, latitude, longitude, points, description)
VALUES 
  ('Mahoe Bay', 'Beach', 18.0392, -63.1207, 50, 'Famous beach near the airport.'),
  ('Grand Case Beach', 'Beach', 18.1039, -63.0561, 75, 'Calm waters and great dining.'),
  ('The Blue Bitch Bar', 'Restaurant', 18.0267, -63.0453, 30, 'Lively bar in Philipsburg.'),
  ('Casino Royale', 'Casino', 18.0301, -63.1201, 100, 'Largest casino on the island.'),
  ('Fort Louis', 'Attraction', 18.0689, -63.0844, 150, 'Historical fort with panoramic views.');
