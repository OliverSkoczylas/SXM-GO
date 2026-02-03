// Privacy, GDPR, and account deletion services
// FR-006: Account deletion with all associated data
// FR-009: GDPR/CCPA compliance (consent logging, data export)

import { getSupabaseClient } from './supabaseClient';
import type { ConsentType, ConsentState, DeletionRequest } from '../types/auth.types';

// ── Consent Management (FR-009) ──

export async function logConsent(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  consentVersion: string = '1.0',
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('privacy_consent_log').insert({
    user_id: userId,
    consent_type: consentType,
    granted,
    consent_version: consentVersion,
  });
  return { error };
}

export async function getConsentState(
  userId: string,
): Promise<{ data: ConsentState; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('privacy_consent_log')
    .select('consent_type, granted, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Deduplicate: take the first (most recent) record per consent_type
  const state: ConsentState = {};
  for (const row of data ?? []) {
    if (!(row.consent_type in state)) {
      state[row.consent_type as ConsentType] = row.granted;
    }
  }

  return { data: state, error };
}

// ── Account Deletion (FR-006) ──

export async function requestAccountDeletion(
  reason?: string,
  immediate: boolean = false,
): Promise<{ data: any; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { reason, immediate },
  });
  return { data, error };
}

export async function cancelAccountDeletion(
  requestId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('data_deletion_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('status', 'pending');
  return { error };
}

export async function getPendingDeletionRequest(
  userId: string,
): Promise<{ data: DeletionRequest | null; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('data_deletion_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();
  return { data, error };
}

// ── Data Export (FR-009: GDPR Article 15) ──

export async function exportUserData(): Promise<{ data: any; error: any }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('export-user-data');
  return { data, error };
}
