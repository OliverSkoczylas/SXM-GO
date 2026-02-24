// Registration screen
// FR-001: Account creation
// FR-009: GDPR consent at signup

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { AUTH_ERRORS, AUTH_MESSAGES } from '../constants/authConstants';
import * as privacyService from '../services/privacyService';
import SignUpForm from '../components/SignUpForm';
import SocialLoginButtons from '../components/SocialLoginButtons';
import Toast from '../../shared/components/Toast';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const auth = useAuth();
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    const { user, error } = await auth.signUpWithEmail(email, password, displayName);
    if (error) {
      throw new Error(
        error.message.includes('already registered')
          ? AUTH_ERRORS.EMAIL_IN_USE
          : error.message,
      );
    }

    // Log GDPR consent (FR-009)
    if (user) {
      await Promise.all([
        privacyService.logConsent(user.id, 'terms_of_service', true),
        privacyService.logConsent(user.id, 'privacy_policy', true),
        privacyService.logConsent(user.id, 'data_processing', true),
      ]);
    }

    showToast(AUTH_MESSAGES.SIGNUP_SUCCESS, 'success');
  };

  const handleGoogleLogin = async () => {
    const { error } = await auth.signInWithGoogle();
    if (error && error.message !== 'cancelled') {
      showToast(AUTH_ERRORS.OAUTH_FAILED, 'error');
    }
  };

  const handleAppleLogin = async () => {
    const { error } = await auth.signInWithApple();
    if (error && error.message !== 'cancelled') {
      showToast(AUTH_ERRORS.OAUTH_FAILED, 'error');
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await auth.signInWithFacebook();
    if (error && error.message !== 'cancelled') {
      showToast(AUTH_ERRORS.OAUTH_FAILED, 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the adventure on St. Maarten</Text>

        <SignUpForm onSubmit={handleSignUp} />

        <SocialLoginButtons
          onGoogle={handleGoogleLogin}
          onApple={handleAppleLogin}
          onFacebook={handleFacebookLogin}
        />

        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signInText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 15,
    color: '#0066CC',
    fontWeight: '600',
  },
});
