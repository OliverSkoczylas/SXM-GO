import React from 'react';
import { render } from '@testing-library/react-native';
import { WelcomeIcon, PointsIcon, LocationIcon } from '../../../src/auth/components/OnboardingIcons';

describe('OnboardingIcons', () => {
  it('renders WelcomeIcon without crashing', () => {
    expect(() => render(React.createElement(WelcomeIcon))).not.toThrow();
  });

  it('renders PointsIcon without crashing', () => {
    expect(() => render(React.createElement(PointsIcon))).not.toThrow();
  });

  it('renders LocationIcon without crashing', () => {
    expect(() => render(React.createElement(LocationIcon))).not.toThrow();
  });
});