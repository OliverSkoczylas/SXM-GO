import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SignUpForm from '../../../src/auth/components/SignUpForm';

describe('SignUpForm', () => {
  it('does not submit if required fields are missing and displays error', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(React.createElement(SignUpForm, { onSubmit }));

    fireEvent.changeText(getByPlaceholderText('Your name'), '');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'invalid');
    fireEvent.changeText(getByPlaceholderText('Min 8 chars, uppercase, number, symbol'), 'weak');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});