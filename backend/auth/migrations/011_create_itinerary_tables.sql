-- Migration 011: Create itineraries and itinerary_items tables
-- FR-047, FR-052: Itinerary System

CREATE TABLE public.itineraries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.itinerary_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  location_id  UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(itinerary_id, location_id)
);

-- RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Itineraries policies
CREATE POLICY "Users can view public itineraries"
  ON public.itineraries FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own itineraries"
  ON public.itineraries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Itinerary items policies
CREATE POLICY "Users can view itinerary items of accessible itineraries"
  ON public.itinerary_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE id = itinerary_id
      AND (is_public = true OR auth.uid() = user_id)
    )
  );

CREATE POLICY "Users can manage items of their own itineraries"
  ON public.itinerary_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE id = itinerary_id
      AND auth.uid() = user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE id = itinerary_id
      AND auth.uid() = user_id
    )
  );

-- Update trigger for itineraries
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_itinerary_updated
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
