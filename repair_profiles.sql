-- ==========================================================
-- SXM GO - PROFILE REPAIR SCRIPT
-- Run this if you see the "Profile Not Found" error in the app.
-- It creates missing database records for existing users.
-- ==========================================================

-- 1. Create missing profiles for any existing auth users
INSERT INTO public.profiles (id, email, display_name)
SELECT 
    id, 
    email, 
    COALESCE(
        raw_user_meta_data->>'full_name', 
        raw_user_meta_data->>'name', 
        split_part(email, '@', 1)
    )
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Create missing preferences for those users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verify
-- This will show you all users that now have valid profiles.
SELECT id, email, display_name, created_at FROM public.profiles;
