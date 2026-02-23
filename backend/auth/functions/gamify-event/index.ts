// Supabase Edge Function: gamify-event (Dev 3)
// Awards points idempotently + updates challenge progress + awards badges.
//
// POST /functions/v1/gamify-event
// Authorization: Bearer <user_jwt>
// Body:
// {
//   "eventType": "checkin",
//   "eventId": "abc123",
//   "meta": { "category": "beach", "locationId": "L001" }
// }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GamifyBody = {
  eventType?: string;
  eventId?: string;
  meta?: Record<string, unknown>;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as GamifyBody;
    const eventType = body.eventType ?? 'checkin';
    const eventId = body.eventId;
    const meta = body.meta ?? {};

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing eventId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // --- Points rule (minimal, independent of others) ---
    // Keep it simple: any 'checkin' event awards 25 points.
    const pointsAwarded = eventType === 'checkin' ? 25 : 0;

    // 1) Insert point transaction (idempotent)
    const { error: ledgerError } = await adminClient.from('point_transactions').insert({
      user_id: user.id,
      event_type: eventType,
      event_id: eventId,
      points: pointsAwarded,
      metadata: meta,
    });

    // If duplicate (unique constraint), return safely with 0 award
    if (ledgerError) {
      return new Response(
        JSON.stringify({
          pointsAwarded: 0,
          duplicate: true,
          completedChallenges: [],
          newBadges: [],
          progressUpdates: [],
          newTotalPoints: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Read current total points, update profile total_points
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('total_points')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newTotalPoints = (profile.total_points ?? 0) + pointsAwarded;

    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({ total_points: newTotalPoints })
      .eq('id', user.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: 'Failed to update profile total_points' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Challenge progress (minimal logic)
    // We’ll increment progress for challenges with goal_type='count_by_category' when meta.category matches.
    const progressUpdates: Array<{ challengeId: string; progress: number; goal: number }> = [];
    const completedChallenges: string[] = [];

    const category = (meta as any)?.category as string | undefined;

    // Fetch challenge definitions (safe; may be empty if seed not applied yet)
    const { data: challengeDefs } = await adminClient
      .from('challenges')
      .select('id, goal_type, goal_value, metadata');

    if (challengeDefs?.length) {
      for (const ch of challengeDefs) {
        // Determine whether this event should count for the challenge
        let counts = false;

        if (ch.goal_type === 'count_by_category') {
          const requiredCategory = (ch.metadata as any)?.category as string | undefined;
          counts = !!requiredCategory && !!category && requiredCategory === category;
        } else if (ch.goal_type === 'distinct_locations') {
          // Placeholder: without a locations table, we cannot robustly track distinct locations yet.
          // For now, count every checkin as progress for this challenge too.
          counts = eventType === 'checkin';
        }

        if (!counts) continue;

        // Upsert progress (server-side)
        // Get current progress
        const { data: existing } = await adminClient
          .from('challenge_progress')
          .select('progress, completed_at')
          .eq('user_id', user.id)
          .eq('challenge_id', ch.id)
          .maybeSingle();

        const currentProgress = existing?.progress ?? 0;
        const alreadyCompleted = !!existing?.completed_at;

        if (alreadyCompleted) continue;

        const nextProgress = currentProgress + 1;
        const justCompleted = nextProgress >= ch.goal_value;

        await adminClient
          .from('challenge_progress')
          .upsert({
            user_id: user.id,
            challenge_id: ch.id,
            progress: nextProgress,
            completed_at: justCompleted ? new Date().toISOString() : null,
          }, { onConflict: 'user_id,challenge_id' });

        progressUpdates.push({ challengeId: ch.id, progress: nextProgress, goal: ch.goal_value });
        if (justCompleted) completedChallenges.push(ch.id);
      }
    }

    // 4) Badges (minimal: points thresholds)
    const newBadges: Array<{ badgeId: string; tier: string }> = [];

    const { data: badgeDefs } = await adminClient
      .from('badges')
      .select('id, tier, rule_type, threshold');

    if (badgeDefs?.length) {
      for (const b of badgeDefs) {
        if (b.rule_type !== 'points_threshold') continue;
        if (newTotalPoints < b.threshold) continue;

        // Insert if not exists (PK prevents duplicates)
        const { error: badgeInsertErr } = await adminClient.from('user_badges').insert({
          user_id: user.id,
          badge_id: b.id,
        });

        if (!badgeInsertErr) {
          newBadges.push({ badgeId: b.id, tier: b.tier });
        }
      }
    }

    return new Response(
      JSON.stringify({
        pointsAwarded,
        duplicate: false,
        newTotalPoints,
        completedChallenges,
        newBadges,
        progressUpdates,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
