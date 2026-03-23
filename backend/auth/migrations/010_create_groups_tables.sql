-- Migration 010: Group Leaderboards and Functionality
-- FR-075: Group Leaderboard
-- FR-080, FR-081, FR-082, FR-083: Private groups and members

-- 1. Create Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  creator_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Group Members table
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- 3. Security (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can create a group
CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Group members can see the group details
CREATE POLICY "Members can view group details"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = public.groups.id AND user_id = auth.uid()
    ) OR creator_id = auth.uid()
  );

-- Members can see each other
CREATE POLICY "Members can view other members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = public.group_members.group_id AND user_id = auth.uid()
    )
  );

-- Users can join a group (insert into group_members)
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Creator can remove members
CREATE POLICY "Creators can remove members"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = public.group_members.group_id AND creator_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- 4. Helper Function to get group leaderboard
CREATE OR REPLACE FUNCTION get_group_leaderboard(target_group_id UUID)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as rank,
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    p.total_points as points
  FROM
    public.profiles p
  JOIN
    public.group_members gm ON gm.user_id = p.id
  WHERE
    gm.group_id = target_group_id
  ORDER BY
    p.total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
