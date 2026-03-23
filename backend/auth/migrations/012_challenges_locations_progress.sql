-- Migration 012: Group leaderboard, itinerary status, and full location seed
-- FR-051/052: Itinerary status + progress tracking
-- FR-075/083: Group leaderboard RPC
-- BR-001: 50+ locations at launch

-- ── 1. Itinerary status column ──────────────────────────────────────────────

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'in_progress', 'completed'));

-- ── 2. Group leaderboard function ───────────────────────────────────────────
-- Called by groupService.ts as rpc('get_group_leaderboard', { target_group_id })

CREATE OR REPLACE FUNCTION get_group_leaderboard(
  target_group_id UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  rank    BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url   TEXT,
  points  INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.total_points DESC) AS rank,
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.total_points AS points
  FROM public.profiles p
  INNER JOIN public.group_members gm ON gm.user_id = p.id
  WHERE gm.group_id = target_group_id
  ORDER BY p.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. generate_invite_code helper ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars))::INT + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ── 4. RLS: allow users to update their own itineraries ─────────────────────

DO $$ BEGIN
  CREATE POLICY "Users can update own itineraries"
    ON public.itineraries FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── 5. Additional St. Maarten locations (seed to 50+) ───────────────────────
-- Skips duplicates via ON CONFLICT DO NOTHING on name+category

DO $$ BEGIN
  ALTER TABLE public.locations
    ADD CONSTRAINT locations_name_category_unique UNIQUE (name, category);
EXCEPTION WHEN duplicate_table THEN null;
END $$;

INSERT INTO public.locations (name, category, latitude, longitude, points, description, address) VALUES
-- Beaches
('Orient Bay Beach',        'Beach',         18.0842, -63.0253, 100, 'Famous clothing-optional beach on the French side.', 'Orient Bay, Saint-Martin'),
('Simpson Bay Beach',       'Beach',         18.0181, -63.1095,  60, 'Calm beach ideal for watersports near the airport.', 'Simpson Bay, Sint Maarten'),
('Maho Beach',              'Beach',         18.0403, -63.1156,  75, 'Iconic beach under Princess Juliana airport approach.', 'Maho, Sint Maarten'),
('Dawn Beach',              'Beach',         18.0625, -63.0272,  80, 'Pristine white sand on the Atlantic side.', 'Dawn Beach, Sint Maarten'),
('Cupecoy Beach',           'Beach',         18.0304, -63.1280,  70, 'Dramatic cliff-backed cove near the Dutch-French border.', 'Cupecoy, Sint Maarten'),
('Friar''s Bay Beach',      'Beach',         18.0941, -63.0666,  65, 'Quiet beach popular with locals.', 'Friar''s Bay, Saint-Martin'),
('Happy Bay',               'Beach',         18.0949, -63.0795,  90, 'Secluded paradise reachable by foot trail.', 'Happy Bay, Saint-Martin'),
('Rouge Beach',             'Beach',         18.1027, -63.0698,  60, 'Small red-sand beach on the French side.', 'Rouge Beach, Saint-Martin'),
('Long Bay Beach',          'Beach',         18.1047, -63.1050,  55, 'Quiet beach on the north-west tip.', 'Long Bay, Saint-Martin'),
('Little Bay Beach',        'Beach',         18.0220, -63.0505,  50, 'Central beach in Philipsburg.', 'Little Bay, Sint Maarten'),

-- Restaurants
('Ric''s Place',            'Restaurant',    18.0267, -63.0453,  40, 'Iconic beach bar in Philipsburg.', 'Front Street, Philipsburg'),
('Karakter Beach Lounge',   'Restaurant',    18.0181, -63.1095,  50, 'Trendy lounge on Simpson Bay Beach.', 'Simpson Bay, Sint Maarten'),
('Sky Beach Club',          'Restaurant',    18.0301, -63.1047,  55, 'Rooftop pool bar with panoramic views.', 'Simpson Bay, Sint Maarten'),
('Sunset Grille',           'Restaurant',    18.0180, -63.1112,  45, 'Popular sunset spot on Simpson Bay.', 'Simpson Bay, Sint Maarten'),
('Pineapple Pete''s',       'Restaurant',    18.0196, -63.1089,  40, 'Caribbean food and live music.', 'Airport Road, Sint Maarten'),
('Bamboo Bernies',          'Restaurant',    18.0296, -63.1225,  40, 'Poolside dining on Maho beach.', 'Maho, Sint Maarten'),
('La Samanna',              'Restaurant',    18.0300, -63.1270,  80, 'Fine dining at a luxury resort.', 'Baie Longue, Saint-Martin'),
('Grand Case Restaurants',  'Restaurant',    18.1039, -63.0561,  60, 'Restaurant Row on the French side.', 'Grand Case, Saint-Martin'),
('Sol',                     'Restaurant',    18.0267, -63.0447,  45, 'Modern fusion in Philipsburg.', 'Front Street, Philipsburg'),
('Tap & Still',             'Restaurant',    18.0275, -63.0455,  35, 'Craft beer and pub food.', 'Front Street, Philipsburg'),

-- Casinos
('SXM Casino',              'Casino',        18.0275, -63.1220,  80, 'Large casino near Maho.', 'Maho, Sint Maarten'),
('Princess Casino',         'Casino',        18.0403, -63.1150,  90, 'Boutique casino at Princess Heights.', 'Cole Bay, Sint Maarten'),
('Atlantis Casino',         'Casino',        18.0267, -63.0448, 100, 'Downtown casino on Front Street.', 'Front Street, Philipsburg'),

-- Attractions
('Butterfly Farm',          'Attraction',    18.0842, -63.0413, 120, 'Tropical butterfly gardens.', 'Airport Road, Sint Maarten'),
('Pic Paradis',             'Attraction',    18.0956, -63.0825, 150, 'Highest peak on the island with hiking trails.', 'Pic Paradis, Saint-Martin'),
('Philipsburg Boardwalk',   'Attraction',    18.0275, -63.0447,  50, 'Scenic waterfront promenade.', 'Philipsburg, Sint Maarten'),
('Marigot Market',          'Attraction',    18.0689, -63.0844,  60, 'Colourful French-side open-air market.', 'Marigot, Saint-Martin'),
('Fort Amsterdam',          'Attraction',    18.0234, -63.0557, 100, '17th-century Dutch fort with cannon views.', 'Great Bay, Sint Maarten'),
('Loterie Farm',            'Attraction',    18.0956, -63.0885, 130, 'Eco-park with zip-lining and pools.', 'Pic Paradis, Saint-Martin'),
('Old Street Philipsburg',  'Attraction',    18.0270, -63.0460,  50, 'Historic shopping street.', 'Old Street, Philipsburg'),
('Mullet Bay',              'Attraction',    18.0421, -63.1197,  70, 'Scenic lagoon with watersports.', 'Mullet Bay, Sint Maarten'),

-- Shopping
('Little Switzerland',      'Shopping',      18.0273, -63.0453,  40, 'Luxury jewellery and watches.', 'Front Street, Philipsburg'),
('Oro de Sol',              'Shopping',      18.0276, -63.0450,  40, 'Fine jewellery on Front Street.', 'Front Street, Philipsburg'),
('Colombier Market',        'Shopping',      18.0680, -63.0843,  35, 'French-side local market.', 'Marigot, Saint-Martin'),
('Sunset Plaza',            'Shopping',      18.0200, -63.1095,  35, 'Mall near Simpson Bay.', 'Simpson Bay, Sint Maarten'),
('Porto Cupecoy',           'Shopping',      18.0311, -63.1278,  50, 'Marina village with boutiques.', 'Cupecoy, Sint Maarten'),
('La Belle Creole',         'Shopping',      18.0680, -63.0825,  45, 'French boutique shopping.', 'Marigot, Saint-Martin'),

-- Entertainment
('Bliss Nightclub',         'Entertainment', 18.0291, -63.1230,  70, 'Premier nightclub on Sint Maarten.', 'Maho, Sint Maarten'),
('Sopranos Piano Bar',      'Entertainment', 18.0298, -63.1220,  60, 'Live music piano bar.', 'Maho, Sint Maarten'),
('Ocean Lounge',            'Entertainment', 18.0267, -63.0445,  50, 'Upscale lounge on Front Street.', 'Front Street, Philipsburg'),
('Zee Best',                'Entertainment', 18.0680, -63.0840,  50, 'Brunch and live entertainment.', 'Marigot, Saint-Martin'),
('Rhino Watersports',       'Entertainment', 18.0181, -63.1100,  80, 'Jet skiing, tubing, and watersports.', 'Simpson Bay, Sint Maarten'),
('St. Maarten Sail & SUP',  'Entertainment', 18.0625, -63.0271,  70, 'Stand-up paddleboarding and sailing.', 'Dawn Beach, Sint Maarten')

ON CONFLICT (name, category) DO NOTHING;
