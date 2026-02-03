// FR-001: Social login buttons (Google, Apple, Facebook)
// Apple Sign-In only shown on iOS (App Store policy requirement)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface SocialLoginButtonsProps {
  onGoogle: () => void;
  onApple: () => void;
  onFacebook: () => void;
  disabled?: boolean;
}

export default function SocialLoginButtons({
  onGoogle,
  onApple,
  onFacebook,
  disabled = false,
}: SocialLoginButtonsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.socialButton, styles.googleButton, disabled && styles.buttonDisabled]}
        onPress={onGoogle}
        disabled={disabled}
      >
        <Text style={[styles.socialButtonText, styles.googleText]}>Continue with Google</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.socialButton, styles.appleButton, disabled && styles.buttonDisabled]}
          onPress={onApple}
          disabled={disabled}
        >
          <Text style={[styles.socialButtonText, styles.appleText]}>Continue with Apple</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.socialButton, styles.facebookButton, disabled && styles.buttonDisabled]}
        onPress={onFacebook}
        disabled={disabled}
      >
        <Text style={[styles.socialButtonText, styles.facebookText]}>Continue with Facebook</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#9CA3AF',
  },
  socialButton: {
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  googleText: {
    color: '#1A1A1A',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleText: {
    color: '#FFFFFF',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  facebookText: {
    color: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
