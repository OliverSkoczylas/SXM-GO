-- Migration 013: Fraud detection, push notification tokens, and remaining locations
-- FR-032/033: Anti-fraud GPS spoofing detection
-- UX-008: Push notification infrastructure
-- BR-001: Ensure 50+ locations at launch

-- ── 1. Push notification device tokens ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device tokens"
  ON public.device_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. Fraud detection: flagged check-ins ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flagged_check_ins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id     UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  flag_reason     TEXT NOT NULL,
  gps_latitude    DOUBLE PRECISION,
  gps_longitude   DOUBLE PRECISION,
  distance_metres DOUBLE PRECISION,
  speed_kmh       DOUBLE PRECISION,
  reviewed        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flagged_check_ins ENABLE ROW LEVEL SECURITY;

-- Only service role can read flagged check-ins (admin use)
CREATE POLICY "Service role can manage flagged check-ins"
  ON public.flagged_check_ins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can insert flags (client-side detection reports)
CREATE POLICY "Authenticated users can report flags"
  ON public.flagged_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── 3. Add server-side check-in distance column ────────────────────────────
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION;

-- ── 4. Remaining locations to ensure 50+ ───────────────────────────────────
INSERT INTO public.locations (name, category, latitude, longitude, points, description, address) VALUES
('Kim Sha Beach',           'Beach',         18.0185, -63.1110,  55, 'Popular local beach on Simpson Bay.', 'Kim Sha, Sint Maarten'),
('Guana Bay Beach',         'Beach',         18.0455, -63.0220,  85, 'Wild Atlantic surf beach on the Dutch side.', 'Guana Bay, Sint Maarten'),
('Baie Rouge',              'Beach',         18.0600, -63.1100,  70, 'Scenic French-side beach with cliff views.', 'Baie Rouge, Saint-Martin'),
('Buccaneer Beach Bar',     'Restaurant',    18.0190, -63.1100,  45, 'Beach bar with live music on Kim Sha.', 'Simpson Bay, Sint Maarten'),
('Topper''s Rhum Distillery','Attraction',   18.0460, -63.0900, 110, 'Craft rum distillery with tastings.', 'Cole Bay, Sint Maarten'),
('Yoda Guy Movie Exhibit',  'Attraction',    18.0270, -63.0450,  90, 'Movie props and SFX museum.', 'Front Street, Philipsburg'),
('Taloula Mango''s',        'Entertainment', 18.0268, -63.0452,  55, 'Caribbean cocktails and dancing.', 'Boardwalk, Philipsburg')
ON CONFLICT (name, category) DO NOTHING;
