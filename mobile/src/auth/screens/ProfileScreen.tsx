// Profile view/edit screen
// FR-002: Display profile data
// FR-005: Update profile info

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { displayNameSchema, bioSchema } from '../utils/validation';
import { AUTH_MESSAGES } from '../constants/authConstants';
import AvatarPicker from '../components/AvatarPicker';
import Toast from '../../shared/components/Toast';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const auth = useAuth();
  const { profile, isUpdating, updateProfile, uploadAvatar, removeAvatar } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.display_name ?? '');
  const [editBio, setEditBio] = useState(profile?.bio ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  const handleSave = async () => {
    setFieldErrors({});

    const nameResult = displayNameSchema.safeParse(editName);
    const bioResult = bioSchema.safeParse(editBio);

    const errors: Record<string, string> = {};
    if (!nameResult.success) errors.displayName = nameResult.error.issues[0].message;
    if (!bioResult.success) errors.bio = bioResult.error.issues[0].message;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    await updateProfile({ display_name: editName.trim(), bio: editBio.trim() });
    setIsEditing(false);
    setToast({ visible: true, message: AUTH_MESSAGES.PROFILE_UPDATED, type: 'success' });
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorSub}>We couldn't load your profile data. This can happen if the initial setup is incomplete.</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => auth.signOut()}
        >
          <Text style={styles.retryButtonText}>Sign Out & Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AvatarPicker
        avatarUrl={profile.avatar_url}
        onImageSelected={uploadAvatar}
        onRemove={removeAvatar}
      />

      {isEditing ? (
        <View style={styles.editSection}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, fieldErrors.displayName ? styles.inputError : undefined]}
              value={editName}
              onChangeText={setEditName}
              autoCapitalize="words"
            />
            {fieldErrors.displayName && (
              <Text style={styles.fieldError}>{fieldErrors.displayName}</Text>
            )}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput, fieldErrors.bio ? styles.inputError : undefined]}
              value={editBio}
              onChangeText={setEditBio}
              multiline
              maxLength={500}
              placeholder="Tell us about yourself..."
            />
            {fieldErrors.bio && <Text style={styles.fieldError}>{fieldErrors.bio}</Text>}
          </View>
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setEditName(profile.display_name);
                setEditBio(profile.bio);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isUpdating && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.viewSection}>
          <Text style={styles.displayName}>{profile.display_name || 'No name set'}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditName(profile.display_name);
              setEditBio(profile.bio);
              setIsEditing(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.total_points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.visit_count}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
      </View>

      {profile.achievements && profile.achievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgeRow}>
            {profile.achievements.map((badge, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PrivacySettings')}
        >
          <Text style={styles.menuItemText}>Privacy & Data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Text style={styles.menuItemText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  errorSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#0066CC', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  viewSection: { alignItems: 'center', marginBottom: 24 },
  displayName: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  bio: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  editButtonText: { color: '#0066CC', fontSize: 14, fontWeight: '600' },
  editSection: { marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#DC2626' },
  fieldError: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  editButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    backgroundColor: '#EBF5FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 13, color: '#0066CC', fontWeight: '500' },
  menuSection: { gap: 1 },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuItemText: { fontSize: 16, color: '#1A1A1A' },
});
