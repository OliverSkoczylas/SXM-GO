// Profile photo upload/delete via Supabase Storage
// FR-002: User profiles shall store profile photo

import { getSupabaseClient } from './supabaseClient';
import type { ImagePickerResponse } from 'react-native-image-picker';

export async function uploadAvatar(
  userId: string,
  image: ImagePickerResponse,
): Promise<{ url: string | null; error: any }> {
  if (!image.assets?.[0]?.uri) {
    return { url: null, error: { message: 'No image selected' } };
  }

  const asset = image.assets[0];
  const uri = asset.uri!; // Already validated above
  const fileExt = asset.fileName?.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/avatar.${fileExt}`;

  // Convert URI to blob for upload
  const response = await fetch(uri);
  const blob = await response.blob();

  const supabase = getSupabaseClient();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: asset.type ?? 'image/jpeg',
    });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update the profile with the new avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId);

  return { url: urlData.publicUrl, error: null };
}

export async function deleteAvatar(
  userId: string,
): Promise<{ error: any }> {
  const supabase = getSupabaseClient();

  // List and remove all files in the user's avatar folder
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    const { error } = await supabase.storage.from('avatars').remove(paths);
    if (error) return { error };
  }

  // Clear avatar_url in profile
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);
  return { error };
}
