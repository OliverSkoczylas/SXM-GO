// Reusable GDPR consent checkbox component
// FR-009: GDPR/CCPA compliance

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  error?: string;
}

export default function ConsentCheckbox({
  checked,
  onToggle,
  label,
  error,
}: ConsentCheckboxProps) {
  return (
    <View>
      <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  error: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 32,
  },
});
