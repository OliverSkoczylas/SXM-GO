-- Migration 011: Seed initial gamification definitions (Dev 3)
-- NOTE: safe to tweak later; this is scaffolding so the system has definitions.

-- Challenges (4 required by assignment)
INSERT INTO public.challenges (id, name, goal_type, goal_value, metadata)
VALUES
  ('foodie', 'Foodie', 'count_by_category', 5, '{"category":"restaurant"}'),
  ('high_roller', 'High Roller', 'count_by_category', 5, '{"category":"casino"}'),
  ('island_nomad', 'Island Nomad', 'distinct_locations', 5, '{}'),
  ('sun_chaser', 'Sun Chaser', 'count_by_category', 5, '{"category":"beach"}')
ON CONFLICT (id) DO NOTHING;

-- Badges (simple point thresholds)
INSERT INTO public.badges (id, name, tier, rule_type, threshold, metadata)
VALUES
  ('points_bronze', 'Points Badge', 'bronze', 'points_threshold', 100, '{}'),
  ('points_silver', 'Points Badge', 'silver', 'points_threshold', 500, '{}'),
  ('points_gold', 'Points Badge', 'gold', 'points_threshold', 1000, '{}')
ON CONFLICT (id) DO NOTHING;
