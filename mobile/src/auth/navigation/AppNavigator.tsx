// Main app navigator with bottom tabs
// FR-104: Bottom navigation bar with tabs: Map, Leaderboard, Challenges, Profile
// Dev 1 sets up the shell. Other devs fill in their tab screens.

import React from 'react';
import ChallengesScreen from '../screens/ChallengesScreen';
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


// ── Type definitions ──

export type AppTabParamList = {
  MapTab: undefined;
  LeaderboardTab: undefined;
  ChallengesTab: undefined;
  ProfileTab: undefined;
};

export type MapStackParamList = {
  Map: undefined;
  LocationDetail: { locationId: string };
  ActivityLive: undefined;
  ActivityDetail: { activityId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  ChangePassword: undefined;
  ItineraryList: undefined;
  ItineraryDetail: { id: string };
  CreateItinerary: undefined;
  ActivityHistory: undefined;
  ActivityDetail: { activityId: string };
  Friends: undefined;
  UserProfile: { userId: string };
};

// ── Navigators ──

const Tab = createBottomTabNavigator<AppTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

import ItineraryListScreen from '../screens/ItineraryListScreen';
import ItineraryDetailScreen from '../screens/ItineraryDetailScreen';
import CreateItineraryScreen from '../screens/CreateItineraryScreen';
import FriendsScreen from '../screens/FriendsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import LocationDetailScreen from '../screens/LocationDetailScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ActivityHistoryScreen from '../screens/ActivityHistoryScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';

const MapStack = createNativeStackNavigator<MapStackParamList>();

function MapStackNavigator() {
  return (
    <MapStack.Navigator>
      <MapStack.Screen
        name="Map"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <MapStack.Screen
        name="LocationDetail"
        component={LocationDetailScreen}
        options={{ headerTitle: 'Location' }}
      />
      <MapStack.Screen
        name="ActivityLive"
        component={ActivityScreen}
        options={{ headerShown: false }}
      />
      <MapStack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ headerTitle: 'Activity' }}
      />
    </MapStack.Navigator>
  );
}

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
      <ProfileStack.Screen
        name="ItineraryList"
        component={ItineraryListScreen}
        options={{ headerTitle: 'Itineraries' }}
      />
      <ProfileStack.Screen
        name="ItineraryDetail"
        component={ItineraryDetailScreen}
        options={{ headerTitle: 'Itinerary Details' }}
      />
      <ProfileStack.Screen
        name="CreateItinerary"
        component={CreateItineraryScreen}
        options={{ headerTitle: 'New Itinerary' }}
      />
      <ProfileStack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ headerTitle: 'Friends' }}
      />
      <ProfileStack.Screen
        name="ActivityHistory"
        component={ActivityHistoryScreen}
        options={{ headerTitle: 'Activity History' }}
      />
      <ProfileStack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ headerTitle: 'Activity' }}
      />
      <ProfileStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerTitle: 'Profile' }}
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
        component={MapStackNavigator}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Leaderboard' }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesScreen}
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
