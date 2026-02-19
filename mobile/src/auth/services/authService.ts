// Core authentication operations
// FR-001: Email/password and social login (Google, Apple, Facebook)
// FR-004: Session persistence
// FR-010: Passwords encrypted via Supabase Auth (bcrypt)

import { AuthError, Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { getSupabaseClient } from './supabaseClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import type { AuthResult } from '../types/auth.types';

// ── Email/Password Auth ──

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  });
  return { user: data.user ?? null, session: data.session ?? null, error };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data.user ?? null, session: data.session ?? null, error };
}

// ── Google OAuth (FR-001) ──

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    // @ts-expect-error - v11 API returns { data: { idToken } } but types may not match
    const idToken = response.data?.idToken ?? response.idToken;

    if (!idToken) {
      return {
        user: null,
        session: null,
        error: { message: 'No ID token returned from Google' } as AuthError,
      };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    return { user: data.user ?? null, session: data.session ?? null, error };
  } catch (err: any) {
    if (err.code === 'SIGN_IN_CANCELLED') {
      return { user: null, session: null, error: { message: 'cancelled' } as AuthError };
    }
    return { user: null, session: null, error: { message: err.message } as AuthError };
  }
}

// ── Apple Sign-In (FR-001, iOS only) ──

export async function signInWithApple(): Promise<AuthResult> {
  if (Platform.OS !== 'ios') {
    return {
      user: null,
      session: null,
      error: { message: 'Apple Sign-In is only available on iOS' } as AuthError,
    };
  }

  try {
    const appleAuthResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    if (!appleAuthResponse.identityToken) {
      return {
        user: null,
        session: null,
        error: { message: 'No identity token returned from Apple' } as AuthError,
      };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: appleAuthResponse.identityToken,
      nonce: appleAuthResponse.nonce,
    });
    return { user: data.user ?? null, session: data.session ?? null, error };
  } catch (err: any) {
    if (err.code === '1001') {
      return { user: null, session: null, error: { message: 'cancelled' } as AuthError };
    }
    return { user: null, session: null, error: { message: err.message } as AuthError };
  }
}

// ── Facebook OAuth (FR-001) ──

export async function signInWithFacebook(): Promise<AuthResult> {
  try {
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

    if (result.isCancelled) {
      return { user: null, session: null, error: { message: 'cancelled' } as AuthError };
    }

    const tokenData = await AccessToken.getCurrentAccessToken();
    if (!tokenData?.accessToken) {
      return {
        user: null,
        session: null,
        error: { message: 'No access token returned from Facebook' } as AuthError,
      };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'facebook',
      token: tokenData.accessToken,
    });
    return { user: data.user ?? null, session: data.session ?? null, error };
  } catch (err: any) {
    return { user: null, session: null, error: { message: err.message } as AuthError };
  }
}

// ── Session Management ──

export async function restoreSession(): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  return {
    user: data.session?.user ?? null,
    session: data.session ?? null,
    error,
  };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseClient();
  return supabase.auth.signOut();
}

// ── Password Management ──

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error };
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}
