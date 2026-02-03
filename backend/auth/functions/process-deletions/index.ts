// Supabase Edge Function: process-deletions
// Processes expired account deletion requests (30-day grace period).
// Should be called on a cron schedule (e.g., daily at 02:00 UTC via pg_cron
// or an external scheduler hitting this endpoint).
//
// POST /functions/v1/process-deletions
// Authorization: Bearer <service_role_key> or webhook secret

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify this is an authorized call (service role or matching secret)
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = Deno.env.get('DELETION_WEBHOOK_SECRET');

    if (webhookSecret) {
      const providedSecret = req.headers.get('X-Webhook-Secret');
      if (providedSecret !== webhookSecret && authHeader !== `Bearer ${serviceRoleKey}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Find all pending deletions whose grace period has expired
    const { data: pendingDeletions, error: fetchError } = await adminClient
      .from('data_deletion_requests')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString());

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending deletions', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{ user_id: string; status: string; error?: string }> = [];

    for (const request of pendingDeletions ?? []) {
      try {
        // Mark as processing
        await adminClient
          .from('data_deletion_requests')
          .update({ status: 'processing' })
          .eq('id', request.id);

        // Delete user from auth (CASCADE deletes profiles, preferences, consent)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(request.user_id);

        if (deleteError) {
          // Revert to pending so it can be retried
          await adminClient
            .from('data_deletion_requests')
            .update({ status: 'pending' })
            .eq('id', request.id);

          results.push({
            user_id: request.user_id,
            status: 'failed',
            error: deleteError.message,
          });
          continue;
        }

        // Clean up storage
        const { data: files } = await adminClient.storage
          .from('avatars')
          .list(request.user_id);

        if (files && files.length > 0) {
          const paths = files.map((f: { name: string }) => `${request.user_id}/${f.name}`);
          await adminClient.storage.from('avatars').remove(paths);
        }

        // Mark as completed
        await adminClient
          .from('data_deletion_requests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            processed_by: 'system-cron',
          })
          .eq('id', request.id);

        results.push({ user_id: request.user_id, status: 'completed' });
      } catch (err) {
        results.push({
          user_id: request.user_id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
        timestamp: new Date().toISOString(),
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
