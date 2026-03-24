import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SocialLoginButtons from '../../../src/auth/components/SocialLoginButtons';

describe('SocialLoginButtons', () => {
  it('renders Google button and calls callback', () => {
    const onGoogle = jest.fn();
    const onApple = jest.fn();

    const { getByText } = render(
      React.createElement(SocialLoginButtons, { onGoogle, onApple })
    );

    const googleButton = getByText('Continue with Google');
    expect(googleButton).toBeTruthy();

    fireEvent.press(googleButton);
    expect(onGoogle).toHaveBeenCalledTimes(1);
  });
});