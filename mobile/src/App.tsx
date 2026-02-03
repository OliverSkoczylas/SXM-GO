// App entry point
// Wraps the entire app in AuthProvider for global auth state,
// then renders the RootNavigator which handles auth/app switching.

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './auth/context/AuthProvider';
import { RootNavigator } from './auth/navigation/RootNavigator';
import ErrorBoundary from './shared/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
