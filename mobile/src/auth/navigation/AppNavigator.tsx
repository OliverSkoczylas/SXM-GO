// Main app navigator with bottom tabs
// FR-104: Bottom navigation bar with tabs: Map, Leaderboard, Challenges, Profile
// Dev 1 sets up the shell. Other devs fill in their tab screens.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import StMaartenMap from '../../map/screens/SXMmap'

// ── Placeholder screens for other devs ──

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={placeholderStyles.container}>
      <Text style={placeholderStyles.text}>{title}</Text>
      <Text style={placeholderStyles.subtext}>Coming soon</Text>
    </View>
  );
}

const MapPlaceholder = () => <StMaartenMap />;          // Dev 2
const LeaderboardPlaceholder = () => <PlaceholderScreen title="Leaderboard" />; // Dev 4
const ChallengesPlaceholder = () => <PlaceholderScreen title="Challenges" />;   // Dev 3

const placeholderStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  text: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  subtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});

// ── Type definitions ──

export type AppTabParamList = {
  MapTab: undefined;
  LeaderboardTab: undefined;
  ChallengesTab: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  ChangePassword: undefined;
};

// ── Navigators ──

const Tab = createBottomTabNavigator<AppTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />
      <ProfileStack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{ headerTitle: 'Privacy & Data' }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerTitle: 'Change Password' }}
      />
    </ProfileStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          borderTopColor: '#F3F4F6',
        },
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapPlaceholder}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardPlaceholder}
        options={{ tabBarLabel: 'Leaderboard' }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesPlaceholder}
        options={{ tabBarLabel: 'Challenges' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
