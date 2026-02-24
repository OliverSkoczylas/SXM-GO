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
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MapScreen from '../screens/MapScreen';
import {
  MapTabIcon,
  LeaderboardTabIcon,
  ChallengesTabIcon,
  ProfileTabIcon,
} from '../components/TabIcons';

// ── Placeholder screens for other devs ──

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={placeholderStyles.container}>
      <Text style={placeholderStyles.text}>{title}</Text>
      <Text style={placeholderStyles.subtext}>Coming soon</Text>
    </View>
  );
}

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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'MapTab') return <MapTabIcon color={color} size={size} />;
          if (route.name === 'LeaderboardTab') return <LeaderboardTabIcon color={color} size={size} />;
          if (route.name === 'ChallengesTab') return <ChallengesTabIcon color={color} size={size} />;
          if (route.name === 'ProfileTab') return <ProfileTabIcon color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
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
