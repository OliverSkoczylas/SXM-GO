// Hook for profile data and mutations
// FR-002, FR-005: Profile viewing and editing

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import * as profileService from '../services/profileService';
import * as avatarService from '../services/avatarService';
import type { ProfileUpdate } from '../types/auth.types';
import type { ImagePickerResponse } from 'react-native-image-picker';

export function useProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      if (!user) return;
      setIsUpdating(true);
      setError(null);
      const { error: updateError } = await profileService.updateProfile(user.id, updates);
      if (updateError) {
        setError(updateError.message);
      } else {
        await refreshProfile();
      }
      setIsUpdating(false);
    },
    [user, refreshProfile],
  );

  const uploadAvatar = useCallback(
    async (image: ImagePickerResponse) => {
      if (!user) return;
      setIsUpdating(true);
      setError(null);
      const { error: uploadError } = await avatarService.uploadAvatar(user.id, image);
      if (uploadError) {
        setError(uploadError.message);
      } else {
        await refreshProfile();
      }
      setIsUpdating(false);
    },
    [user, refreshProfile],
  );

  const removeAvatar = useCallback(async () => {
    if (!user) return;
    setIsUpdating(true);
    setError(null);
    const { error: deleteError } = await avatarService.deleteAvatar(user.id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      await refreshProfile();
    }
    setIsUpdating(false);
  }, [user, refreshProfile]);

  const setLocationTracking = useCallback(
    async (enabled: boolean) => {
      if (!user) return;
      setError(null);
      const { error: trackError } = await profileService.setLocationTracking(
        user.id,
        enabled,
      );
      if (trackError) {
        setError(trackError.message);
      } else {
        await refreshProfile();
      }
    },
    [user, refreshProfile],
  );

  return {
    profile,
    isUpdating,
    error,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    setLocationTracking,
  };
}
