-- Migration 003: User preferences table
-- FR-005: Users shall be able to update profile information and settings
-- UX-009: Users shall customize notification preferences
-- FR-111: Multi-language support (en, nl, es, fr)

CREATE TABLE public.user_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Notification preferences (UX-009)
  notify_challenges   BOOLEAN NOT NULL DEFAULT TRUE,
  notify_badges       BOOLEAN NOT NULL DEFAULT TRUE,
  notify_friends      BOOLEAN NOT NULL DEFAULT TRUE,
  notify_leaderboard  BOOLEAN NOT NULL DEFAULT TRUE,
  notify_marketing    BOOLEAN NOT NULL DEFAULT FALSE,

  -- App preferences
  language            TEXT NOT NULL DEFAULT 'en'
                      CHECK (language IN ('en', 'nl', 'es', 'fr')),
  distance_unit       TEXT NOT NULL DEFAULT 'km'
                      CHECK (distance_unit IN ('km', 'mi')),
  theme               TEXT NOT NULL DEFAULT 'system'
                      CHECK (theme IN ('light', 'dark', 'system')),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER on_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create default preferences when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_preferences();
