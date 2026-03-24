import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AvatarPicker from '../../../src/auth/components/AvatarPicker';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('../../../src/shared/services/permissionService', () => ({
  requestPhotoLibraryPermission: jest.fn().mockResolvedValue('granted'),
}));

describe('AvatarPicker', () => {
  it('renders placeholder when no avatar is provided', () => {
    const onImageSelected = jest.fn();

    const { getByText } = render(
      React.createElement(AvatarPicker, { avatarUrl: null, onImageSelected })
    );

    expect(getByText('+')).toBeTruthy();
    expect(getByText('Change Photo')).toBeTruthy();
  });

  it('calls onRemove when remove button is pressed', () => {
    const onImageSelected = jest.fn();
    const onRemove = jest.fn();

    const { getByText } = render(
      React.createElement(AvatarPicker, {
        avatarUrl: 'https://example.com/avatar.png',
        onImageSelected,
        onRemove,
      })
    );

    fireEvent.press(getByText('Remove'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});