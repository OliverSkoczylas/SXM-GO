import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AddToItineraryModal from '../../../src/auth/components/AddToItineraryModal';

jest.mock('../../../src/auth/hooks/useItineraries', () => ({
  useItineraries: jest.fn(),
}));

const { useItineraries } = require('../../../src/auth/hooks/useItineraries');

describe('AddToItineraryModal', () => {
  it('renders itinerary items and handles close', () => {
    const onClose = jest.fn();
    const onAdd = jest.fn();

    useItineraries.mockReturnValue({
      itineraries: [{ id: '1', name: 'Trip 1' }],
      loading: false,
      fetchMyItineraries: jest.fn(),
      addItem: jest.fn().mockResolvedValue(undefined),
    });

    const { getByText } = render(
      React.createElement(AddToItineraryModal, { visible: true, onClose, onAdd, locationId: 'loc1' })
    );

    expect(getByText('Add to Itinerary')).toBeTruthy();
    expect(getByText('Trip 1')).toBeTruthy();
    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});