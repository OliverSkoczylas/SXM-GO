// Supabase Edge Function: export-user-data
// FR-009: GDPR Article 15 - Right of access / data portability
// Returns all user data across all tables as a JSON document.
//
// POST /functions/v1/export-user-data
// Authorization: Bearer <user_jwt>
// Response: JSON blob of all user data

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify calling user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client to read across all tables
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Gather data from all tables in parallel
    // Tables from other devs may not exist yet - errors are caught gracefully
    const queries = {
      profile: adminClient.from('profiles').select('*').eq('id', user.id).single(),
      preferences: adminClient.from('user_preferences').select('*').eq('user_id', user.id).single(),
      consent_history: adminClient.from('privacy_consent_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      deletion_requests: adminClient.from('data_deletion_requests').select('*').eq('user_id', user.id).order('requested_at', { ascending: false }),
    };

    // Tables from other devs - wrap in try/catch as they may not exist yet
    const optionalQueries: Record<string, Promise<any>> = {};
    const optionalTables = ['check_ins', 'point_transactions', 'activities', 'itineraries'];
    for (const table of optionalTables) {
      optionalQueries[table] = adminClient
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .then(res => res.data)
        .catch(() => null);
    }

    const [profile, preferences, consentHistory, deletionRequests] = await Promise.all([
      queries.profile,
      queries.preferences,
      queries.consent_history,
      queries.deletion_requests,
    ]);

    const optionalData: Record<string, any> = {};
    for (const [key, promise] of Object.entries(optionalQueries)) {
      optionalData[key] = await promise;
    }

    // Get avatar files
    const { data: avatarFiles } = await adminClient.storage.from('avatars').list(user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      auth_metadata: {
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        providers: user.app_metadata?.providers ?? [],
      },
      profile: profile.data,
      preferences: preferences.data,
      consent_history: consentHistory.data,
      deletion_requests: deletionRequests.data,
      storage: {
        avatar_files: avatarFiles?.map((f: { name: string }) => f.name) ?? [],
      },
      ...optionalData,
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="sxm-go-data-export-${user.id}.json"`,
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
