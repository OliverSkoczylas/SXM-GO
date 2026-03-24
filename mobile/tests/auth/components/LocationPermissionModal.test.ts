import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LocationPermissionModal from '../../../src/auth/components/LocationPermissionModal';

describe('LocationPermissionModal', () => {
  it('renders title and description', () => {
    const onAllow = jest.fn();
    const onDeny = jest.fn();

    const { getByText } = render(
      React.createElement(LocationPermissionModal, { visible: true, onAllow, onDeny })
    );

    expect(getByText('Enable Location')).toBeTruthy();
  });

  it('calls onAllow and onDeny callbacks', () => {
    const onAllow = jest.fn();
    const onDeny = jest.fn();

    const { getByText } = render(
      React.createElement(LocationPermissionModal, { visible: true, onAllow, onDeny })
    );

    fireEvent.press(getByText('Allow Location Access'));
    fireEvent.press(getByText('Not Now'));

    expect(onAllow).toHaveBeenCalledTimes(1);
    expect(onDeny).toHaveBeenCalledTimes(1);
  });
});