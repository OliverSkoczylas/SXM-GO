-- Migration 008: Point transactions ledger (Dev 3)
-- Purpose: record every awarded points event + prevent duplicates (idempotency)

CREATE TABLE public.point_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,   -- e.g. 'checkin'
  event_id    TEXT NOT NULL,   -- external id from Dev 2 (checkInId)
  points      INTEGER NOT NULL CHECK (points >= 0),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: cannot award points twice for same (user, event_type, event_id)
CREATE UNIQUE INDEX uq_point_transactions_user_event
  ON public.point_transactions(user_id, event_type, event_id);

CREATE INDEX idx_point_transactions_user_created
  ON public.point_transactions(user_id, created_at DESC);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions (optional UI + auditing)
CREATE POLICY "Users can read own point transactions"
  ON public.point_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies (server-only via Edge Function/service role)
