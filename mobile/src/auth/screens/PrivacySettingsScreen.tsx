// Privacy & Data management screen
// FR-006: Account deletion
// FR-007/FR-008: Location tracking toggle
// FR-009: GDPR data export, consent management

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import * as privacyService from '../services/privacyService';
import { AUTH_MESSAGES } from '../constants/authConstants';
import { APP_CONFIG } from '../../../shared/config/app.config';
import type { ConsentState, DeletionRequest } from '../types/auth.types';
import Toast from '../../../shared/components/Toast';

export default function PrivacySettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, setLocationTracking } = useProfile();
  const [consentState, setConsentState] = useState<ConsentState>({});
  const [pendingDeletion, setPendingDeletion] = useState<DeletionRequest | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  useEffect(() => {
    if (!user) return;
    privacyService.getConsentState(user.id).then(({ data }) => setConsentState(data));
    privacyService.getPendingDeletionRequest(user.id).then(({ data }) => setPendingDeletion(data));
  }, [user?.id]);

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      await privacyService.logConsent(user!.id, 'location_tracking', true);
    } else {
      await privacyService.logConsent(user!.id, 'location_tracking', false);
    }
    await setLocationTracking(enabled);
  };

  const handleMarketingToggle = async (enabled: boolean) => {
    await privacyService.logConsent(user!.id, 'marketing_emails', enabled);
    setConsentState((prev) => ({ ...prev, marketing_emails: enabled }));
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    await privacyService.logConsent(user!.id, 'analytics', enabled);
    setConsentState((prev) => ({ ...prev, analytics: enabled }));
  };

  const handleExportData = async () => {
    setIsExporting(true);
    const { data, error } = await privacyService.exportUserData();
    setIsExporting(false);

    if (error) {
      setToast({ visible: true, message: 'Export failed. Please try again.', type: 'error' });
    } else {
      setToast({ visible: true, message: AUTH_MESSAGES.DATA_EXPORT_READY, type: 'success' });
      // In a full implementation, this would share/save the JSON file
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      `This will schedule your account for deletion in ${APP_CONFIG.deletionGracePeriodDays} days. You can cancel during this period. All your data will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            const { error } = await privacyService.requestAccountDeletion();
            if (error) {
              setToast({ visible: true, message: 'Failed to request deletion.', type: 'error' });
            } else {
              setToast({
                visible: true,
                message: AUTH_MESSAGES.DELETION_REQUESTED,
                type: 'info',
              });
              await signOut();
            }
          },
        },
      ],
    );
  };

  const handleCancelDeletion = async () => {
    if (!pendingDeletion) return;
    const { error } = await privacyService.cancelAccountDeletion(pendingDeletion.id);
    if (error) {
      setToast({ visible: true, message: 'Failed to cancel deletion.', type: 'error' });
    } else {
      setPendingDeletion(null);
      setToast({ visible: true, message: AUTH_MESSAGES.DELETION_CANCELLED, type: 'success' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {pendingDeletion && (
        <View style={styles.deletionBanner}>
          <Text style={styles.deletionBannerText}>
            Account deletion scheduled for{' '}
            {new Date(pendingDeletion.scheduled_for).toLocaleDateString()}.
          </Text>
          <TouchableOpacity onPress={handleCancelDeletion}>
            <Text style={styles.cancelDeletionLink}>Cancel Deletion</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Location Tracking</Text>
            <Text style={styles.toggleDescription}>Required for check-ins</Text>
          </View>
          <Switch
            value={profile?.location_tracking_enabled ?? false}
            onValueChange={handleLocationToggle}
            trackColor={{ true: '#0066CC' }}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Data Consent</Text>
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Marketing Emails</Text>
            <Text style={styles.toggleDescription}>Receive promotions and updates</Text>
          </View>
          <Switch
            value={consentState.marketing_emails ?? false}
            onValueChange={handleMarketingToggle}
            trackColor={{ true: '#0066CC' }}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Analytics</Text>
            <Text style={styles.toggleDescription}>Help improve the app</Text>
          </View>
          <Switch
            value={consentState.analytics ?? true}
            onValueChange={handleAnalyticsToggle}
            trackColor={{ true: '#0066CC' }}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Data</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleExportData}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#0066CC" />
          ) : (
            <Text style={styles.actionText}>Export My Data</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Danger Zone</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
          <Text style={styles.dangerText}>Delete Account</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 40 },
  deletionBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    alignItems: 'center',
  },
  deletionBannerText: { fontSize: 14, color: '#92400E', textAlign: 'center' },
  cancelDeletionLink: { color: '#0066CC', fontWeight: '600', marginTop: 8 },
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
  toggleInfo: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 16, color: '#1A1A1A' },
  toggleDescription: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  actionRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionText: { fontSize: 16, color: '#0066CC' },
  dangerText: { fontSize: 16, color: '#DC2626' },
});
