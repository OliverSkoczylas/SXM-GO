// Hook for user preferences
// FR-005: Update settings
// UX-009: Notification preferences

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import * as preferencesService from '../services/preferencesService';
import type { UserPreferences, UserPreferencesUpdate } from '../types/auth.types';

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      const { data, error: loadError } = await preferencesService.getPreferences(user.id);
      if (loadError) {
        setError(loadError.message);
      } else {
        setPreferences(data);
      }
      setIsLoading(false);
    };
    load();
  }, [user?.id]);

  const updatePreferences = useCallback(
    async (updates: UserPreferencesUpdate) => {
      if (!user) return;
      setIsUpdating(true);
      setError(null);
      const { data, error: updateError } = await preferencesService.updatePreferences(
        user.id,
        updates,
      );
      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setPreferences(data);
      }
      setIsUpdating(false);
    },
    [user],
  );

  return {
    preferences,
    isLoading,
    isUpdating,
    error,
    updatePreferences,
  };
}
