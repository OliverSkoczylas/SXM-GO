// Supabase configuration
// TR-023: In production, load these from react-native-config (.env file).
// The anon key is designed to be public (RLS enforces access control),
// but should still be loaded from environment config in release builds.

// To use react-native-config in production:
// import Config from 'react-native-config';
// export const SUPABASE_CONFIG = {
//   url: Config.SUPABASE_URL!,
//   anonKey: Config.SUPABASE_ANON_KEY!,
// } as const;

export const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_ANON_KEY_HERE',
} as const;
