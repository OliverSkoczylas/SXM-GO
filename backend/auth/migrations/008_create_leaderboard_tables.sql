-- Migration 008: Create point_transactions table and leaderboard functions
-- FR-072: Global Leaderboard
-- FR-073: Weekly Leaderboard (Monday reset)
-- FR-074: Monthly Leaderboard

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,
  type        TEXT NOT NULL, -- 'check-in', 'bonus', 'streak'
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at);

-- RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read point transactions for leaderboard purposes
-- (In a production app, you might restrict this more or use a View/RPC)
CREATE POLICY "Allow public read of point transactions for authenticated users"
  ON public.point_transactions FOR SELECT
  TO authenticated
  USING (true);

-- Functions for Leaderboards
-- Using functions instead of views for better performance and parameterization (like limits)

-- FR-072: Global Leaderboard (All-time)
CREATE OR REPLACE FUNCTION get_global_leaderboard(limit_count INTEGER DEFAULT 100)
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
  ORDER BY
    p.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FR-073: Weekly Leaderboard (Monday reset)
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.points), 0) DESC) as rank,
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(t.points), 0) as points
  FROM
    public.profiles p
  LEFT JOIN
    public.point_transactions t ON t.user_id = p.id AND t.created_at >= date_trunc('week', now())
  GROUP BY
    p.id
  ORDER BY
    points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FR-074: Monthly Leaderboard
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.points), 0) DESC) as rank,
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(t.points), 0) as points
  FROM
    public.profiles p
  LEFT JOIN
    public.point_transactions t ON t.user_id = p.id AND t.created_at >= date_trunc('month', now())
  GROUP BY
    p.id
  ORDER BY
    points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
