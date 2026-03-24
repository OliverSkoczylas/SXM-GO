import React from 'react';
import { render } from '@testing-library/react-native';
import { MapTabIcon, LeaderboardTabIcon, ChallengesTabIcon, ProfileTabIcon } from '../../../src/auth/components/TabIcons';

describe('TabIcons', () => {
  it('renders MapTabIcon without crashing', () => {
    expect(() => render(React.createElement(MapTabIcon, { color: '#ff0000' }))).not.toThrow();
  });

  it('renders LeaderboardTabIcon without crashing', () => {
    expect(() => render(React.createElement(LeaderboardTabIcon, { color: '#00ff00' }))).not.toThrow();
  });

  it('renders ChallengesTabIcon without crashing', () => {
    expect(() => render(React.createElement(ChallengesTabIcon, { color: '#0000ff' }))).not.toThrow();
  });

  it('renders ProfileTabIcon without crashing', () => {
    expect(() => render(React.createElement(ProfileTabIcon, { color: '#123456' }))).not.toThrow();
  });
});