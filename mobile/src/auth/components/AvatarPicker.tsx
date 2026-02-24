// Profile photo picker component
// FR-002: User profiles shall store profile photo
// UX-004: Request photo library permission before opening picker

import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { APP_CONFIG } from '../../shared/config/app.config';
import { requestPhotoLibraryPermission } from '../../shared/services/permissionService';

interface AvatarPickerProps {
  avatarUrl: string | null;
  onImageSelected: (response: ImagePickerResponse) => void;
  onRemove?: () => void;
  size?: number;
}

export default function AvatarPicker({
  avatarUrl,
  onImageSelected,
  onRemove,
  size = 100,
}: AvatarPickerProps) {
  const handlePress = async () => {
    const permission = await requestPhotoLibraryPermission();
    if (permission !== 'granted') return;

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel || response.errorCode) return;

        const asset = response.assets?.[0];
        if (asset?.fileSize && asset.fileSize > APP_CONFIG.maxAvatarSizeBytes) {
          Alert.alert('Image too large', 'Please choose an image under 5MB.');
          return;
        }

        onImageSelected(response);
      },
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Text style={styles.placeholderText}>+</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.changeText}>Change Photo</Text>
      </TouchableOpacity>
      {avatarUrl && onRemove && (
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    backgroundColor: '#E5E7EB',
  },
  placeholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#9CA3AF',
  },
  changeText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  removeText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 4,
  },
});
