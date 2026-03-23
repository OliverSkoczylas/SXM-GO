import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import LeaderboardList from '../components/LeaderboardList';
import { useLeaderboard } from '../hooks/useLeaderboard';

const LeaderboardScreen = () => {
  const { leaderboardData, loading, error, refreshLeaderboard } = useLeaderboard();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/*
          FR-072, FR-073, FR-074: This is where a tab navigator
          (e.g., @react-navigation/material-top-tabs) would go to
          switch between Global, Weekly, and Monthly leaderboards.
          For MVP, we only show the Global leaderboard.
        */}
        <LeaderboardList
          data={leaderboardData}
          loading={loading}
          error={error}
          onRefresh={refreshLeaderboard}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // A light grey background for the whole screen area
  },
  container: {
    flex: 1,
  },
});

export default LeaderboardScreen;
