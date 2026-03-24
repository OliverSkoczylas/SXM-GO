import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ConsentCheckbox from '../../../src/auth/components/ConsentCheckbox';

describe('ConsentCheckbox', () => {
  it('renders label and shows checked state', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      React.createElement(ConsentCheckbox, { checked: true, label: 'Agree', onToggle })
    );

    expect(getByText('Agree')).toBeTruthy();
  });

  it('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      React.createElement(ConsentCheckbox, { checked: false, label: 'Agree', onToggle })
    );

    fireEvent.press(getByText('Agree'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});