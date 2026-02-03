-- Migration 004: Privacy consent audit log
-- FR-009: GDPR and CCPA compliance requires an auditable consent trail.
-- Every consent action (grant or revoke) is logged as an immutable record.
-- The most recent record per consent_type determines the current state.

CREATE TABLE public.privacy_consent_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type    TEXT NOT NULL
                  CHECK (consent_type IN (
                    'terms_of_service',
                    'privacy_policy',
                    'location_tracking',
                    'marketing_emails',
                    'data_processing',
                    'analytics'
                  )),
  granted         BOOLEAN NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consent rows are immutable: only INSERT, never UPDATE or DELETE by users.
-- Index for efficient lookup of latest consent per type.
CREATE INDEX idx_consent_user_type
  ON public.privacy_consent_log(user_id, consent_type, created_at DESC);
