// Login screen
// FR-001: Email/password + social login
// UX-006: Returning user flow

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { AUTH_ERRORS } from '../constants/authConstants';
import LoginForm from '../components/LoginForm';
import SocialLoginButtons from '../components/SocialLoginButtons';
import Toast from '../../../shared/components/Toast';
import { TouchableOpacity } from 'react-native';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const auth = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as const });

  const showError = (message: string) => {
    setToast({ visible: true, message, type: 'error' });
  };

  const handleEmailLogin = async (email: string, password: string) => {
    const { error } = await auth.signInWithEmail(email, password);
    if (error) {
      throw new Error(
        error.message.includes('Invalid login')
          ? AUTH_ERRORS.INVALID_CREDENTIALS
          : error.message,
      );
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await auth.signInWithGoogle();
    if (error) {
      if (error.message === 'cancelled') return;
      showError(AUTH_ERRORS.OAUTH_FAILED);
    }
  };

  const handleAppleLogin = async () => {
    const { error } = await auth.signInWithApple();
    if (error) {
      if (error.message === 'cancelled') return;
      showError(AUTH_ERRORS.OAUTH_FAILED);
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await auth.signInWithFacebook();
    if (error) {
      if (error.message === 'cancelled') return;
      showError(AUTH_ERRORS.OAUTH_FAILED);
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue exploring St. Maarten</Text>

        <LoginForm
          onSubmit={handleEmailLogin}
          onForgotPassword={() => navigation.navigate('ForgotPassword')}
        />

        <SocialLoginButtons
          onGoogle={handleGoogleLogin}
          onApple={handleAppleLogin}
          onFacebook={handleFacebookLogin}
        />

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
    paddingTop: 80,
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
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signUpText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 15,
    color: '#0066CC',
    fontWeight: '600',
  },
});
