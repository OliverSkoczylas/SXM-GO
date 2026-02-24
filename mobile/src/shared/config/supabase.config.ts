// Supabase configuration
// TR-023: Load config from react-native-config (.env file)
// The anon key is designed to be public (RLS enforces access control),
// but loaded from environment config for flexibility across environments.

import Config from 'react-native-config';

// Validate required environment variables
if (!Config.SUPABASE_URL || !Config.SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase config missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env file.',
  );
}

export const SUPABASE_CONFIG = {
  url: Config.SUPABASE_URL || '',
  anonKey: Config.SUPABASE_ANON_KEY || '',
} as const;
