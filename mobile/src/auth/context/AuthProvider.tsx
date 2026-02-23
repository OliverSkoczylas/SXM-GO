// Auth state provider
// FR-003: Real-time cloud sync for user data
// FR-004: Persistent sessions - restores session from Keychain on mount
// Subscribes to Supabase auth state changes and realtime profile/preferences updates.

import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, AuthContextValue } from './AuthContext';
import type { AuthState, Profile, UserPreferences } from '../types/auth.types';
import * as authService from '../services/authService';
import * as profileService from '../services/profileService';
import * as preferencesService from '../services/preferencesService';
import { getSupabaseClient } from '../services/supabaseClient';
import { initializeOAuthProviders } from '../services/oauthConfig';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    session: null,
    profile: null,
    preferences: null,
    onboardingSeen: false,
  });

  // On mount: initialize OAuth providers and restore session from Keychain (FR-001, FR-004)
  useEffect(() => {
    initializeOAuthProviders();

    const init = async () => {
      try {
        const [sessionResult, onboardingVal] = await Promise.all([
          authService.restoreSession(),
          AsyncStorage.getItem('onboarding_seen').catch(() => null),
        ]);
        const { user, session } = sessionResult;
        const onboardingSeen = onboardingVal === '1';

        if (user && session) {
          const [{ data: profile }, { data: preferences }] = await Promise.all([
            profileService.getProfile(user.id),
            preferencesService.getPreferences(user.id),
          ]);
          setState({
            isLoading: false,
            isAuthenticated: true,
            user,
            session,
            profile,
            preferences,
            onboardingSeen,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false, onboardingSeen }));
        }
      } catch {
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
        const [{ data: profile }, { data: preferences }] = await Promise.all([
          profileService.getProfile(session.user.id),
          preferencesService.getPreferences(session.user.id),
        ]);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: true,
          user: session.user,
          session,
          profile,
          preferences,
        }));
      } else if (event === 'SIGNED_OUT') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          user: null,
          session: null,
          profile: null,
          preferences: null,
        }));
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

  // FR-003: Realtime user_preferences sync - listen for changes to notification/theme settings.
  useEffect(() => {
    if (!state.user) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`preferences:${state.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${state.user.id}`,
        },
        (payload) => {
          setState((prev) => ({
            ...prev,
            preferences: payload.new as UserPreferences,
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

  const refreshPreferences = useCallback(async () => {
    if (!state.user) return;
    const { data } = await preferencesService.getPreferences(state.user.id);
    if (data) {
      setState((prev) => ({ ...prev, preferences: data }));
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
    refreshPreferences,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
