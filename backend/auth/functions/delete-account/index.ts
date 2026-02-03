// Supabase Edge Function: delete-account
// FR-006: Delete user account and all associated data
// GDPR Article 17: Right to erasure with 30-day grace period
//
// POST /functions/v1/delete-account
// Body: { reason?: string, immediate?: boolean }
// Authorization: Bearer <user_jwt>

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DeleteAccountRequest {
  reason?: string;
  immediate?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the calling user's JWT
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

    // Client scoped to the calling user
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

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body: DeleteAccountRequest = await req.json().catch(() => ({}));

    // Check for existing pending deletion request
    const { data: existingRequest } = await adminClient
      .from('data_deletion_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'A deletion request is already pending' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const scheduledFor = body.immediate
      ? now.toISOString()
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Log the deletion request
    await adminClient.from('data_deletion_requests').insert({
      user_id: user.id,
      reason: body.reason ?? null,
      status: body.immediate ? 'processing' : 'pending',
      scheduled_for: scheduledFor,
    });

    if (body.immediate) {
      // Hard delete: remove from auth.users (CASCADE handles profiles, preferences, consent)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        // Mark request as failed
        await adminClient
          .from('data_deletion_requests')
          .update({ status: 'pending' })
          .eq('user_id', user.id)
          .eq('status', 'processing');

        return new Response(
          JSON.stringify({ error: 'Account deletion failed. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Clean up storage (avatars)
      const { data: files } = await adminClient.storage.from('avatars').list(user.id);
      if (files && files.length > 0) {
        const paths = files.map((f: { name: string }) => `${user.id}/${f.name}`);
        await adminClient.storage.from('avatars').remove(paths);
      }

      // Mark request as completed
      await adminClient
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_by: 'system',
        })
        .eq('user_id', user.id)
        .eq('status', 'processing');

      return new Response(
        JSON.stringify({ message: 'Account deleted successfully.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: `Account scheduled for deletion on ${scheduledFor}. You can cancel within this period.`,
        scheduled_for: scheduledFor,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
