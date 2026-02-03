// Location permission explanation modal
// UX-004: App shall request location permission with clear explanation
// FR-007: Location data only with explicit permission

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export default function LocationPermissionModal({
  visible,
  onAllow,
  onDeny,
}: LocationPermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            SXM GO uses your location to verify check-ins at attractions, beaches,
            and restaurants around St. Maarten.
          </Text>
          <Text style={styles.details}>
            {'\u2022'} Your location is only used when you check in{'\n'}
            {'\u2022'} We never share your location with third parties{'\n'}
            {'\u2022'} You can disable tracking anytime in Settings
          </Text>

          <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
            <Text style={styles.allowButtonText}>Allow Location Access</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.denyButton} onPress={onDeny}>
            <Text style={styles.denyButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  details: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  allowButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  denyButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#6B7280',
    fontSize: 15,
  },
});
