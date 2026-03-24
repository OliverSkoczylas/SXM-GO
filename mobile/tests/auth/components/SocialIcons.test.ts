import React from 'react';
import { render } from '@testing-library/react-native';
import { AppleIcon, FacebookIcon, GoogleIcon } from '../../../src/auth/components/SocialIcons';

describe('SocialIcons', () => {
  it('renders GoogleIcon without crashing', () => {
    expect(() => render(React.createElement(GoogleIcon))).not.toThrow();
  });

  it('renders AppleIcon without crashing', () => {
    expect(() => render(React.createElement(AppleIcon))).not.toThrow();
  });

  it('renders FacebookIcon without crashing', () => {
    expect(() => render(React.createElement(FacebookIcon))).not.toThrow();
  });
});