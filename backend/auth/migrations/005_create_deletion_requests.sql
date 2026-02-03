-- Migration 005: Account deletion requests
-- FR-006: Users shall be able to delete their account and all associated data.
-- GDPR Article 17 "Right to erasure": 30-day grace period before hard deletion.
-- Users can cancel a pending request within the grace period.

CREATE TABLE public.data_deletion_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  completed_at    TIMESTAMPTZ,
  processed_by    TEXT
);

CREATE INDEX idx_deletion_pending
  ON public.data_deletion_requests(status, scheduled_for)
  WHERE status = 'pending';
