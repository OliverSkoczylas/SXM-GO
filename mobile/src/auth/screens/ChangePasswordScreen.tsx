// Change password screen
// FR-005: Users shall be able to update profile information

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { updatePassword } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { changePasswordSchema } from '../utils/validation';
import { AUTH_MESSAGES, AUTH_ERRORS } from '../constants/authConstants';
import Toast from '../../shared/components/Toast';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { user, signInWithEmail } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const handleSubmit = async () => {
    setErrors({});

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Re-authenticate before changing password to verify identity
    const { error: authError } = await signInWithEmail(user!.email!, currentPassword);
    if (authError) {
      setIsSubmitting(false);
      setErrors({ currentPassword: 'Current password is incorrect.' });
      return;
    }

    const { error } = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (error) {
      setToast({ visible: true, message: error.message ?? AUTH_ERRORS.UNKNOWN, type: 'error' });
    } else {
      setToast({ visible: true, message: AUTH_MESSAGES.PASSWORD_CHANGED, type: 'success' });
      setTimeout(() => navigation.goBack(), 1500);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={[styles.input, errors.currentPassword ? styles.inputError : undefined]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            textContentType="password"
            editable={!isSubmitting}
          />
          {errors.currentPassword && (
            <Text style={styles.fieldError}>{errors.currentPassword}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={[styles.input, errors.newPassword ? styles.inputError : undefined]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!isSubmitting}
            placeholder="Min 8 chars, uppercase, number, symbol"
          />
          {errors.newPassword && <Text style={styles.fieldError}>{errors.newPassword}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword ? styles.inputError : undefined]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!isSubmitting}
          />
          {errors.confirmPassword && (
            <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 16 },
  field: { marginBottom: 20 },
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
  inputError: { borderColor: '#DC2626' },
  fieldError: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  button: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
