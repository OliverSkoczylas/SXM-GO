// Root navigator: switches between Auth and App stacks based on session state
// FR-004: Users shall remain logged in across app sessions
// UX-005: New users see Auth flow
// UX-006: Returning users auto-login to Map view

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
