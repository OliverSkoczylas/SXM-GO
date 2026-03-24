-- Migration 014: Friends System
-- FR-097 to FR-100: User interactions and friend requests

CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'blocked');

CREATE TABLE public.friendships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          public.friendship_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ensure only one friendship record exists between two users
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see their own friendship records
CREATE POLICY "Users can see their own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests (insert)
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can accept/reject/block (update)
CREATE POLICY "Users can update their own friendships"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_friendship_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friendship_updated
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_update();

-- View for "Friends" (accepted friendships)
CREATE OR REPLACE VIEW public.friends_view AS
SELECT 
  f.id as friendship_id,
  f.user_id,
  f.friend_id,
  f.status,
  p.display_name,
  p.avatar_url,
  p.total_points
FROM public.friendships f
JOIN public.profiles p ON (p.id = f.friend_id AND f.user_id = auth.uid()) OR (p.id = f.user_id AND f.friend_id = auth.uid())
WHERE f.status = 'accepted';
