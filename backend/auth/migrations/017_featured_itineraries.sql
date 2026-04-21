-- Migration 017: Featured / pre-made itineraries
-- Item 30: Foodie Tour, Beach Hopper, Cultural Explorer
-- FR-055 extension: curated public itineraries seeded by the platform

-- ── 1. Add is_featured column ────────────────────────────────────────────────
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Make user_id nullable for platform-owned itineraries ─────────────────
--    The FK (→ auth.users) is preserved and enforced when non-NULL.
--    A check constraint ensures the column is only NULL on featured rows.
ALTER TABLE public.itineraries
  ALTER COLUMN user_id DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.itineraries
    ADD CONSTRAINT itineraries_user_or_featured
    CHECK (user_id IS NOT NULL OR is_featured = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Index for fast featured query ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itineraries_featured
  ON public.itineraries (is_featured)
  WHERE is_featured = true;

-- ── 4. Seed the three curated itineraries ───────────────────────────────────
--    Idempotent: skips if a featured itinerary with that name already exists.
DO $$
DECLARE
  v_foodie_id   UUID;
  v_beach_id    UUID;
  v_culture_id  UUID;
BEGIN

  -- ── 4a. Foodie Tour ────────────────────────────────────────────────────────
  SELECT id INTO v_foodie_id
    FROM public.itineraries
   WHERE name = 'Foodie Tour' AND is_featured = true
   LIMIT 1;

  IF v_foodie_id IS NULL THEN
    INSERT INTO public.itineraries
      (name, description, is_public, is_featured, status, difficulty, user_id)
    VALUES (
      'Foodie Tour',
      'A culinary journey across both sides of St. Maarten — from the famous Restaurant Row in Grand Case to beachside bars on the Dutch coast. Savour fresh seafood, Caribbean fusion, and craft cocktails along the way.',
      true, true, 'planning', 'easy', NULL
    )
    RETURNING id INTO v_foodie_id;

    -- Items in visit order (order_index 0-based)
    INSERT INTO public.itinerary_items (itinerary_id, location_id, order_index)
    SELECT v_foodie_id, l.id, t.ord
    FROM (VALUES
      ('Grand Case Restaurants', 'Restaurant',  0),
      ('Karakter Beach Lounge',  'Restaurant',  1),
      ('Buccaneer Beach Bar',    'Restaurant',  2),
      ('The Blue Bitch Bar',     'Restaurant',  3),
      ('Taloula Mango''s',       'Entertainment', 4)
    ) AS t(loc_name, loc_cat, ord)
    JOIN public.locations l
      ON l.name = t.loc_name AND l.category::text = t.loc_cat
    ON CONFLICT (itinerary_id, location_id) DO NOTHING;
  END IF;

  -- ── 4b. Beach Hopper ───────────────────────────────────────────────────────
  SELECT id INTO v_beach_id
    FROM public.itineraries
   WHERE name = 'Beach Hopper' AND is_featured = true
   LIMIT 1;

  IF v_beach_id IS NULL THEN
    INSERT INTO public.itineraries
      (name, description, is_public, is_featured, status, difficulty, user_id)
    VALUES (
      'Beach Hopper',
      'Hit the best beaches on both sides of the island in one epic day. Watch planes land over Maho, soak up the sun at Orient Bay, and end the day at the secluded paradise of Happy Bay. Pack your sunscreen!',
      true, true, 'planning', 'easy', NULL
    )
    RETURNING id INTO v_beach_id;

    INSERT INTO public.itinerary_items (itinerary_id, location_id, order_index)
    SELECT v_beach_id, l.id, t.ord
    FROM (VALUES
      ('Maho Beach',         'Beach', 0),
      ('Simpson Bay Beach',  'Beach', 1),
      ('Baie Rouge',         'Beach', 2),
      ('Orient Bay Beach',   'Beach', 3),
      ('Happy Bay',          'Beach', 4)
    ) AS t(loc_name, loc_cat, ord)
    JOIN public.locations l
      ON l.name = t.loc_name AND l.category::text = t.loc_cat
    ON CONFLICT (itinerary_id, location_id) DO NOTHING;
  END IF;

  -- ── 4c. Cultural Explorer ──────────────────────────────────────────────────
  SELECT id INTO v_culture_id
    FROM public.itineraries
   WHERE name = 'Cultural Explorer' AND is_featured = true
   LIMIT 1;

  IF v_culture_id IS NULL THEN
    INSERT INTO public.itineraries
      (name, description, is_public, is_featured, status, difficulty, user_id)
    VALUES (
      'Cultural Explorer',
      'Discover the rich heritage of St. Maarten — a 17th-century hilltop fort, a one-of-a-kind Hollywood prop museum, a working craft rum distillery, and a tropical butterfly farm. History, art, and local spirit in one tour.',
      true, true, 'planning', 'moderate', NULL
    )
    RETURNING id INTO v_culture_id;

    INSERT INTO public.itinerary_items (itinerary_id, location_id, order_index)
    SELECT v_culture_id, l.id, t.ord
    FROM (VALUES
      ('Fort Louis',              'Attraction', 0),
      ('Philipsburg Boardwalk',   'Attraction', 1),
      ('Yoda Guy Movie Exhibit',  'Attraction', 2),
      ('Topper''s Rhum Distillery', 'Attraction', 3),
      ('Butterfly Farm',          'Attraction', 4)
    ) AS t(loc_name, loc_cat, ord)
    JOIN public.locations l
      ON l.name = t.loc_name AND l.category::text = t.loc_cat
    ON CONFLICT (itinerary_id, location_id) DO NOTHING;
  END IF;

END $$;
