-- ==========================================================
-- SXM GO - COMPLETE DATABASE SETUP
-- This script sets up the Leaderboard, Locations, and Check-in systems.
-- ==========================================================

-- 1. CLEANUP (Optional: Uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS public.check_ins;
-- DROP TABLE IF EXISTS public.point_transactions;
-- DROP TABLE IF EXISTS public.locations;
-- DROP TYPE IF EXISTS public.location_category;

-- 2. ENUMS & TABLES
DO $$ BEGIN
    CREATE TYPE public.location_category AS ENUM (
        'Restaurant', 'Beach', 'Casino', 'Shopping', 'Attraction', 'Entertainment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Point Transactions (for Weekly/Monthly tracking)
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,
  type        TEXT NOT NULL, -- 'check-in', 'bonus', 'streak'
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Locations
CREATE TABLE IF NOT EXISTS public.locations (
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

-- Check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_id)
);

-- 3. INDEXING
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);

-- 4. SECURITY (RLS)
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read point transactions" ON public.point_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read locations" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read own checkins" ON public.check_ins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow insert own checkins" ON public.check_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. LEADERBOARD FUNCTIONS
CREATE OR REPLACE FUNCTION get_global_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (rank BIGINT, user_id UUID, display_name TEXT, avatar_url TEXT, points INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as rank,
    p.id, p.display_name, p.avatar_url, p.total_points FROM public.profiles p
  ORDER BY p.total_points DESC LIMIT limit_count;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (rank BIGINT, user_id UUID, display_name TEXT, avatar_url TEXT, points BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.points), 0) DESC) as rank,
    p.id, p.display_name, p.avatar_url, COALESCE(SUM(t.points), 0) as points
  FROM public.profiles p
  LEFT JOIN public.point_transactions t ON t.user_id = p.id AND t.created_at >= date_trunc('week', now())
  GROUP BY p.id ORDER BY points DESC LIMIT limit_count;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_monthly_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (rank BIGINT, user_id UUID, display_name TEXT, avatar_url TEXT, points BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.points), 0) DESC) as rank,
    p.id, p.display_name, p.avatar_url, COALESCE(SUM(t.points), 0) as points
  FROM public.profiles p
  LEFT JOIN public.point_transactions t ON t.user_id = p.id AND t.created_at >= date_trunc('month', now())
  GROUP BY p.id ORDER BY points DESC LIMIT limit_count;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CHECK-IN TRIGGER
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

DROP TRIGGER IF EXISTS on_check_in_created ON public.check_ins;
CREATE TRIGGER on_check_in_created
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_check_in();

-- 7. SEED DATA
-- Locations
INSERT INTO public.locations (name, category, latitude, longitude, points, description)
VALUES 
  ('Mahoe Bay', 'Beach', 18.0392, -63.1207, 50, 'Famous beach near the airport.'),
  ('Grand Case Beach', 'Beach', 18.1039, -63.0561, 75, 'Calm waters and great dining.'),
  ('The Blue Bitch Bar', 'Restaurant', 18.0267, -63.0453, 30, 'Lively bar in Philipsburg.'),
  ('Casino Royale', 'Casino', 18.0301, -63.1201, 100, 'Largest casino on the island.'),
  ('Fort Louis', 'Attraction', 18.0689, -63.0844, 150, 'Historical fort with panoramic views.')
ON CONFLICT DO NOTHING;

-- Demo Leaderboard Users
INSERT INTO public.profiles (id, display_name, email, total_points, avatar_url)
VALUES 
  (gen_random_uuid(), 'IslandExplorer', 'island@example.com', 2540, 'https://i.pravatar.cc/150?u=1'),
  (gen_random_uuid(), 'BeachBum88', 'beach@example.com', 1820, 'https://i.pravatar.cc/150?u=2'),
  (gen_random_uuid(), 'SXM_Legend', 'legend@example.com', 4100, 'https://i.pravatar.cc/150?u=3'),
  (gen_random_uuid(), 'SunsetChaser', 'sunset@example.com', 3100, 'https://i.pravatar.cc/150?u=5')
ON CONFLICT DO NOTHING;

-- 8. ITINERARY SYSTEM
CREATE TABLE IF NOT EXISTS public.itineraries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  location_id  UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(itinerary_id, location_id)
);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public itineraries"
  ON public.itineraries FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own itineraries"
  ON public.itineraries FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view itinerary items"
  ON public.itinerary_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.itineraries WHERE id = itinerary_id AND (is_public = true OR auth.uid() = user_id)));

CREATE POLICY "Users can manage items of their own itineraries"
  ON public.itinerary_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.itineraries WHERE id = itinerary_id AND auth.uid() = user_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.itineraries WHERE id = itinerary_id AND auth.uid() = user_id));
