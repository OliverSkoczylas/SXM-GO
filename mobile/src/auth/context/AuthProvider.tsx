// Auth state provider
// FR-003: Real-time cloud sync for user data
// FR-004: Persistent sessions - restores session from Keychain on mount
// Subscribes to Supabase auth state changes and realtime profile updates.

import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthContext, AuthContextValue } from './AuthContext';
import type { AuthState, Profile } from '../types/auth.types';
import * as authService from '../services/authService';
import * as profileService from '../services/profileService';
import { getSupabaseClient } from '../services/supabaseClient';
import { initializeOAuthProviders } from '../services/oauthConfig';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    session: null,
    profile: null,
  });

  // On mount: initialize OAuth providers and restore session from Keychain (FR-001, FR-004)
  useEffect(() => {
    initializeOAuthProviders();

    const init = async () => {
      const { user, session } = await authService.restoreSession();
      if (user && session) {
        const { data: profile } = await profileService.getProfile(user.id);
        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          session,
          profile,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    init();
  }, []);

  // Subscribe to auth state changes (sign in, sign out, token refresh)
  useEffect(() => {
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await profileService.getProfile(session.user.id);
        setState({
          isLoading: false,
          isAuthenticated: true,
          user: session.user,
          session,
          profile,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          session: null,
          profile: null,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState((prev) => ({ ...prev, session }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // FR-003: Realtime profile sync - listen for changes to the user's profile row.
  // This ensures the UI updates when Dev 2/3 update total_points or visit_count.
  useEffect(() => {
    if (!state.user) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`profile:${state.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${state.user.id}`,
        },
        (payload) => {
          setState((prev) => ({
            ...prev,
            profile: payload.new as Profile,
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const { data } = await profileService.getProfile(state.user.id);
    if (data) {
      setState((prev) => ({ ...prev, profile: data }));
    }
  }, [state.user]);

  const contextValue: AuthContextValue = {
    ...state,
    signUpWithEmail: authService.signUpWithEmail,
    signInWithEmail: authService.signInWithEmail,
    signInWithGoogle: authService.signInWithGoogle,
    signInWithApple: authService.signInWithApple,
    signInWithFacebook: authService.signInWithFacebook,
    signOut: async () => {
      await authService.signOut();
    },
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
