// 3-screen onboarding flow
// UX-001: First-time users complete Welcome, Permissions, Tutorial
// UX-002: Tutorial explains checking in, earning points, completing challenges
// UX-003: Shown only once — marks flag in AsyncStorage on completion

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { ONBOARDING_SCREENS } from '../constants/authConstants';
import { useLocationPermission } from '../hooks/useLocationPermission';
import LocationPermissionModal from '../components/LocationPermissionModal';
import { WelcomeIcon, PointsIcon, LocationIcon } from '../components/OnboardingIcons';

const { width } = Dimensions.get('window');

const ICONS = [WelcomeIcon, PointsIcon, LocationIcon];

const ONBOARDING_SEEN_KEY = 'onboarding_seen';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { showExplanation, promptForPermission, requestPermission, dismissExplanation } =
    useLocationPermission();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const markSeen = () => AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1').catch(() => {});

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SCREENS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Last screen - prompt for location, then navigate to Login
      promptForPermission();
    }
  };

  const handleSkip = () => {
    markSeen();
    navigation.replace('Login');
  };

  const handleLocationAllow = async () => {
    dismissExplanation();
    await requestPermission();
    markSeen();
    navigation.replace('Login');
  };

  const handleLocationDeny = () => {
    dismissExplanation();
    markSeen();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SCREENS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ index }) => {
          const Icon = ICONS[index];
          const item = ONBOARDING_SCREENS[index];
          return (
            <View style={[styles.slide, { width }]}>
              <Icon size={200} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {ONBOARDING_SCREENS.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === ONBOARDING_SCREENS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      <LocationPermissionModal
        visible={showExplanation}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 32,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#0066CC',
    width: 24,
  },
  nextButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
