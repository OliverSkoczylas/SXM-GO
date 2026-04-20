-- Migration 016: Social/friend system + locations detail columns
-- Adds friend requests, confirmed friendships, and enriches location data.

-- ── 1. Friend requests table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.friend_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Lifecycle state
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A user pair can only have one active request at a time
  UNIQUE (sender_id, receiver_id),

  -- Prevent self-friending
  CHECK (sender_id <> receiver_id)
);

-- ── 2. Friendships table ───────────────────────────────────────────────────────
-- A confirmed friendship is stored as two rows (A→B and B→A) so that
-- querying "all friends of user X" is a simple WHERE user_id = X.

CREATE TABLE IF NOT EXISTS public.friendships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, friend_id)
);

-- ── 3. Row Level Security — friend_requests ────────────────────────────────────

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Only the sender can create a request
CREATE POLICY "Sender can insert friend request"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Sender and receiver can both read requests that involve them
CREATE POLICY "Sender or receiver can view friend request"
  ON public.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Only the receiver can update (accept / decline) a request
CREATE POLICY "Receiver can update friend request"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Only the sender can cancel (delete) a pending request
CREATE POLICY "Sender can delete friend request"
  ON public.friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- ── 4. Row Level Security — friendships ───────────────────────────────────────

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can read any friendship row they are a party to
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ── 5. Indexes ─────────────────────────────────────────────────────────────────

-- friend_requests: fast lookup by sender or receiver for inbox/outbox views
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id
  ON public.friend_requests(sender_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id
  ON public.friend_requests(receiver_id);

-- friendships: fast lookup of all friends for a given user
CREATE INDEX IF NOT EXISTS idx_friendships_user_id
  ON public.friendships(user_id);

CREATE INDEX IF NOT EXISTS idx_friendships_friend_id
  ON public.friendships(friend_id);

-- ── 6. Enrich locations with detail columns ────────────────────────────────────
-- The base locations table was created in migration 009. These columns
-- were already partially present in that migration (description, hours);
-- the ADD COLUMN IF NOT EXISTS guard makes this re-runnable safely.

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS hours        TEXT,                    -- e.g. "Mon-Sun 9am-10pm"
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS website      TEXT,
  ADD COLUMN IF NOT EXISTS photos       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avg_rating   FLOAT   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INT     NOT NULL DEFAULT 0;
