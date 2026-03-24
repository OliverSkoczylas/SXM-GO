import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginForm from '../../../src/auth/components/LoginForm';

describe('LoginForm', () => {
  it('does not submit invalid form values and shows validation errors', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onForgotPassword = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      React.createElement(LoginForm, { onSubmit, onForgotPassword })
    );

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), '');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});