// App settings screen
// FR-005: Update preferences
// UX-009: Notification preferences
// FR-111: Language selection

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { usePreferences } from '../hooks/usePreferences';
import { AUTH_MESSAGES } from '../constants/authConstants';
import type { Language, DistanceUnit, Theme } from '../types/auth.types';
import Toast from '../../shared/components/Toast';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Dutch' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { preferences, isLoading, updatePreferences } = usePreferences();
  const [toast, setToast] = useState({ visible: false, message: '' });

  const handleToggle = async (key: string, value: boolean) => {
    await updatePreferences({ [key]: value });
  };

  const handleSelect = async (key: string, value: string) => {
    await updatePreferences({ [key]: value });
    setToast({ visible: true, message: AUTH_MESSAGES.PROFILE_UPDATED });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (isLoading || !preferences) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.section}>
        <ToggleRow
          label="Challenges"
          value={preferences.notify_challenges}
          onToggle={(v) => handleToggle('notify_challenges', v)}
        />
        <ToggleRow
          label="Badges"
          value={preferences.notify_badges}
          onToggle={(v) => handleToggle('notify_badges', v)}
        />
        <ToggleRow
          label="Friends"
          value={preferences.notify_friends}
          onToggle={(v) => handleToggle('notify_friends', v)}
        />
        <ToggleRow
          label="Leaderboard"
          value={preferences.notify_leaderboard}
          onToggle={(v) => handleToggle('notify_leaderboard', v)}
        />
        <ToggleRow
          label="Marketing"
          value={preferences.notify_marketing}
          onToggle={(v) => handleToggle('notify_marketing', v)}
        />
      </View>

      <Text style={styles.sectionTitle}>Language</Text>
      <View style={styles.section}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.value}
            style={styles.selectRow}
            onPress={() => handleSelect('language', lang.value)}
          >
            <Text style={styles.selectLabel}>{lang.label}</Text>
            {preferences.language === lang.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.section}>
        {THEMES.map((theme) => (
          <TouchableOpacity
            key={theme.value}
            style={styles.selectRow}
            onPress={() => handleSelect('theme', theme.value)}
          >
            <Text style={styles.selectLabel}>{theme.label}</Text>
            {preferences.theme === theme.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Distance</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.selectRow}
          onPress={() => handleSelect('distance_unit', 'km')}
        >
          <Text style={styles.selectLabel}>Kilometers</Text>
          {preferences.distance_unit === 'km' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.selectRow}
          onPress={() => handleSelect('distance_unit', 'mi')}
        >
          <Text style={styles.selectLabel}>Miles</Text>
          {preferences.distance_unit === 'mi' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: '#0066CC' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  toggleLabel: { fontSize: 16, color: '#1A1A1A' },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  selectLabel: { fontSize: 16, color: '#1A1A1A' },
  checkmark: { fontSize: 16, color: '#0066CC', fontWeight: '600' },
  signOutButton: {
    marginTop: 32,
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  signOutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
});
